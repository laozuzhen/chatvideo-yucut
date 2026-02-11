const { app, BrowserWindow, session, globalShortcut, Menu, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
  editorUrl: process.env.EDITOR_URL || 'http://localhost:8080',
  scraperPort: process.env.SCRAPER_PORT || 3100,
  devMode: !app.isPackaged
};

let mainWindow;
let scraperServer;
let scraperConnected = false;
let connectionCheckInterval = null;

// ==================== Scraper HTTP Server ====================

async function startScraperServer() {
  const express = require('express');
  const cors = require('cors');
  
  const STORAGE_DIR = path.join(__dirname, 'storage');
  
  // 确保存储目录存在
  const storageDirs = ['videos', 'music', 'images', 'svg', 'thumbnails'];
  storageDirs.forEach(dir => {
    const fullPath = path.join(STORAGE_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // 动态导入 scraper 模块
  let MixkitScraper, IncompetechMusic, PexelsScraper, YtDlpWrapper, handleToolCall;
  
  try {
    const scraperPath = CONFIG.devMode 
      ? './scraper-dist' 
      : path.join(process.resourcesPath, 'scraper-dist');
    
    const mixkitModule = await import(path.join(scraperPath, 'tools/scraper/mixkit.js'));
    const incompetechModule = await import(path.join(scraperPath, 'tools/scraper/incompetech.js'));
    const pexelsModule = await import(path.join(scraperPath, 'tools/scraper/pexels.js'));
    const ytdlpModule = await import(path.join(scraperPath, 'tools/video-platform/ytdlp.js'));
    const toolHandlerModule = await import(path.join(scraperPath, 'toolHandler.js'));
    
    MixkitScraper = mixkitModule.MixkitScraper;
    IncompetechMusic = incompetechModule.IncompetechMusic;
    PexelsScraper = pexelsModule.PexelsScraper;
    YtDlpWrapper = ytdlpModule.YtDlpWrapper;
    handleToolCall = toolHandlerModule.handleToolCall;
  } catch (e) {
    console.error('[Scraper] Failed to load scraper modules:', e);
    return null;
  }

  // 创建爬虫实例
  const mixkitScraper = new MixkitScraper();
  const incompetechMusic = new IncompetechMusic();
  const pexelsScraper = new PexelsScraper();
  const ytdlpWrapper = new YtDlpWrapper();

  // Express 应用
  const expressApp = express();
  expressApp.use(express.json());
  expressApp.use(cors({ origin: '*' }));
  expressApp.use('/storage', express.static(STORAGE_DIR));

  // API 路由
  expressApp.get('/api/status', async (req, res) => {
    try {
      const ytdlpAvailable = await ytdlpWrapper.checkAvailability();
      const countFiles = (dir) => {
        const fullPath = path.join(STORAGE_DIR, dir);
        if (!fs.existsSync(fullPath)) return 0;
        return fs.readdirSync(fullPath).filter(f => !f.startsWith('.')).length;
      };
      res.json({
        status: 'running',
        version: '1.0.0',
        port: CONFIG.scraperPort,
        ytdlp: ytdlpAvailable,
        storage: {
          videos: countFiles('videos'),
          music: countFiles('music'),
          images: countFiles('images'),
          svg: countFiles('svg'),
        }
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  expressApp.post('/api/search/video', async (req, res) => {
    try {
      const { query, source = 'mixkit', maxResults = 10 } = req.body;
      if (!query) return res.status(400).json({ error: 'query is required' });
      
      let results = [];
      if (source === 'mixkit') {
        results = await mixkitScraper.searchVideos(query, maxResults);
      }
      res.json({ success: true, query, source, count: results.length, results });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  expressApp.post('/api/search/image', async (req, res) => {
    try {
      const { query, source = 'pexels', maxResults = 10 } = req.body;
      if (!query) return res.status(400).json({ error: 'query is required' });
      
      let results = [];
      if (source === 'pexels') {
        results = await pexelsScraper.searchImages(query, maxResults);
      }
      res.json({ success: true, query, source, count: results.length, results });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  expressApp.post('/api/search/music', async (req, res) => {
    try {
      const { query, source = 'incompetech', genre, mood, maxResults = 10 } = req.body;
      if (!query) return res.status(400).json({ error: 'query is required' });
      
      let results = [];
      if (source === 'incompetech') {
        results = await incompetechMusic.search(query, { genre, mood, maxResults });
      } else if (source === 'mixkit') {
        results = await mixkitScraper.searchMusic(query, maxResults);
      }
      res.json({ success: true, query, source, count: results.length, results });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  expressApp.post('/api/search/media', async (req, res) => {
    try {
      const { query, type = 'all', maxResults = 10 } = req.body;
      if (!query) return res.status(400).json({ error: 'query is required' });

      const results = { videos: [], music: [], images: [] };
      const errors = [];

      if (type === 'all' || type === 'video') {
        try {
          results.videos = (await mixkitScraper.searchVideos(query, maxResults)).map(v => ({ ...v, source: 'mixkit' }));
        } catch (e) { errors.push(`video: ${e.message}`); }
      }

      if (type === 'all' || type === 'music') {
        try {
          const [mixkitMusic, incompetechResults] = await Promise.all([
            mixkitScraper.searchMusic(query, Math.ceil(maxResults / 2)).catch(() => []),
            incompetechMusic.search(query, { maxResults: Math.ceil(maxResults / 2) }).catch(() => [])
          ]);
          results.music = [
            ...mixkitMusic.map(m => ({ ...m, source: 'mixkit' })),
            ...incompetechResults.map(m => ({ ...m, source: 'incompetech' }))
          ];
        } catch (e) { errors.push(`music: ${e.message}`); }
      }

      if (type === 'all' || type === 'image') {
        try {
          results.images = (await pexelsScraper.searchImages(query, maxResults)).map(i => ({ ...i, source: 'pexels' }));
        } catch (e) { errors.push(`image: ${e.message}`); }
      }

      const totalCount = results.videos.length + results.music.length + results.images.length;
      res.json({
        success: true, query, type,
        counts: { videos: results.videos.length, music: results.music.length, images: results.images.length, total: totalCount },
        results,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  expressApp.post('/api/download', async (req, res) => {
    try {
      const { url, type = 'video', filename } = req.body;
      if (!url) return res.status(400).json({ error: 'url is required' });

      const result = await handleToolCall('download_media', { url, type, filename }, null);
      if (result.isError) {
        const errorText = result.content[0]?.text || 'Unknown error';
        return res.status(500).json({ success: false, error: errorText });
      }

      const data = JSON.parse(result.content[0]?.text || '{}');
      let normalizedPath = data.localPath?.replace(/\\/g, '/') || '';
      const storageIndex = normalizedPath.indexOf('/storage/');
      if (storageIndex !== -1) {
        normalizedPath = normalizedPath.substring(storageIndex);
      } else if (normalizedPath.startsWith('./storage')) {
        normalizedPath = normalizedPath.replace('./storage', '/storage');
      } else if (normalizedPath.startsWith('storage')) {
        normalizedPath = '/' + normalizedPath;
      }
      const localUrl = `http://localhost:${CONFIG.scraperPort}${normalizedPath}`;

      res.json({
        success: true,
        localPath: data.localPath,
        localUrl,
        size: data.size,
        filename: normalizedPath.split('/').pop() || filename || 'unknown',
        type
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  expressApp.post('/api/ytdlp', async (req, res) => {
    try {
      const { url, format = 'best', audioOnly = false } = req.body;
      if (!url) return res.status(400).json({ error: 'url is required' });

      const isAvailable = await ytdlpWrapper.checkAvailability();
      if (!isAvailable) {
        return res.status(503).json({ success: false, error: 'yt-dlp is not installed' });
      }

      const result = await ytdlpWrapper.download(url, {
        outputDir: path.join(STORAGE_DIR, 'videos'),
        format,
        audioOnly
      });

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }

      const localUrl = `http://localhost:${CONFIG.scraperPort}/storage/videos/${path.basename(result.localPath || '')}`;
      res.json({ success: true, localPath: result.localPath, localUrl, title: result.title, duration: result.duration });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  expressApp.post('/api/ytdlp/info', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'url is required' });

      const isAvailable = await ytdlpWrapper.checkAvailability();
      if (!isAvailable) {
        return res.status(503).json({ success: false, error: 'yt-dlp is not installed' });
      }

      const info = await ytdlpWrapper.getVideoInfo(url);
      res.json({ success: true, info });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  expressApp.get('/api/files/:type', (req, res) => {
    try {
      const { type } = req.params;
      const validTypes = ['videos', 'music', 'images', 'svg'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid type` });
      }

      const dirPath = path.join(STORAGE_DIR, type);
      if (!fs.existsSync(dirPath)) return res.json({ files: [] });

      const files = fs.readdirSync(dirPath)
        .filter(f => !f.startsWith('.'))
        .map(f => {
          const filePath = path.join(dirPath, f);
          const stats = fs.statSync(filePath);
          return {
            name: f,
            size: stats.size,
            url: `http://localhost:${CONFIG.scraperPort}/storage/${type}/${f}`,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          };
        });
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  expressApp.delete('/api/files/:type/:filename', (req, res) => {
    try {
      const { type, filename } = req.params;
      const validTypes = ['videos', 'music', 'images', 'svg'];
      if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
      }

      const filePath = path.join(STORAGE_DIR, type, filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

      fs.unlinkSync(filePath);
      res.json({ success: true, message: `Deleted ${filename}` });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // 启动服务器
  return new Promise((resolve) => {
    scraperServer = expressApp.listen(CONFIG.scraperPort, () => {
      console.log(`[Scraper] HTTP Server running on port ${CONFIG.scraperPort}`);
      resolve(scraperServer);
    });
  });
}

// ==================== 连接检查 ====================

async function waitForScraper(maxRetries = 10) {
  const http = require('http');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${CONFIG.scraperPort}/api/status`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status: ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => { req.destroy(); reject(new Error('Timeout')); });
      });
      console.log('[Box] Scraper is ready');
      scraperConnected = true;
      updateTrayStatus();
      return true;
    } catch (e) {
      console.log(`[Box] Waiting for scraper... (${i + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, 500));
    }
  }
  console.error('[Box] Scraper failed to start');
  scraperConnected = false;
  updateTrayStatus();
  return false;
}

function startConnectionCheck() {
  const http = require('http');
  connectionCheckInterval = setInterval(async () => {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${CONFIG.scraperPort}/api/status`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status: ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('Timeout')); });
      });
      if (!scraperConnected) {
        console.log('[Box] Scraper reconnected');
        scraperConnected = true;
        updateTrayStatus();
      }
    } catch (e) {
      if (scraperConnected) {
        console.log('[Box] Scraper disconnected');
        scraperConnected = false;
        updateTrayStatus();
      }
    }
  }, 5000);
}

function updateTrayStatus() {
  if (mainWindow) {
    const statusText = scraperConnected ? '● 已连接' : '○ 未连接';
    mainWindow.setTitle(`语剪 · EDITOR ${statusText}`);
  }
}

// ==================== 窗口创建 ====================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: '语剪 · EDITOR',
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'default',
    webPreferences: {
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 中文菜单栏
  const menuTemplate = [
    {
      label: '文件',
      submenu: [
        { label: '刷新页面', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: '强制刷新', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow?.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: '退出', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '开发者工具', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于语剪',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于语剪',
              message: '语剪 · EDITOR v1.0.0',
              detail: 'AI 驱动的视频剪辑工具\n\n本地服务端口: ' + CONFIG.scraperPort
            });
          }
        }
      ]
    }
  ];
  
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [''] } });
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Box] Failed to load ${validatedURL}: ${errorDescription}`);
    const errorHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>连接失败</title>
      <style>body{font-family:sans-serif;background:#1a1a2e;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
      .container{text-align:center;padding:40px;background:rgba(255,255,255,0.1);border-radius:16px;max-width:500px}
      h1{color:#ff6b6b}button{background:#3b82f6;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;margin-top:20px}</style></head>
      <body><div class="container"><h1>⚠️ 无法连接到 Editor</h1><p>地址: ${validatedURL}</p><p>错误: ${errorDescription}</p>
      <button onclick="location.reload()">🔄 重试</button></div></body></html>`;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  });

  console.log('[Box] Loading editor:', CONFIG.editorUrl);
  mainWindow.loadURL(CONFIG.editorUrl);
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ==================== 应用启动 ====================

app.whenReady().then(async () => {
  console.log('[Box] Starting V-Editor Box...');
  console.log('[Box] Dev mode:', CONFIG.devMode);

  nativeTheme.themeSource = 'dark';

  // 1. 启动内置 scraper 服务器
  await startScraperServer();
  
  // 2. 等待 scraper 就绪
  await waitForScraper();

  // 3. 创建窗口
  createWindow();

  // 4. 启动连接状态检查
  startConnectionCheck();

  // 5. 注册快捷键
  globalShortcut.register('F12', () => BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools());
  globalShortcut.register('CommandOrControl+Shift+I', () => BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  globalShortcut.unregisterAll();
  if (connectionCheckInterval) clearInterval(connectionCheckInterval);
  if (scraperServer) scraperServer.close();
});

process.on('uncaughtException', (err) => console.error('[Box] Uncaught exception:', err));
