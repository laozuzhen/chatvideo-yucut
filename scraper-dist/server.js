"use strict";
/**
 * V-Editor Scraper HTTP Server
 *
 * 📝 用途：为 Editor 前端提供 HTTP API，支持素材搜索和下载
 * ✅ 方案 A：本地 HTTP 服务 + 静态文件服务
 *
 * 架构：
 * - Editor 前端 (https://editor.xxx.com) 运行在远程服务器
 * - 用户通过自定义盒子（Electron）访问 Editor
 * - 盒子内运行本地 Scraper (localhost:3100)
 * - Editor 通过 fetch 调用本地 Scraper API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 爬虫模块
const mixkit_1 = require("./tools/scraper/mixkit");
const incompetech_1 = require("./tools/scraper/incompetech");
const pexels_1 = require("./tools/scraper/pexels");
const ytdlp_1 = require("./tools/video-platform/ytdlp");
const toolHandler_1 = require("./toolHandler");
// ==================== 配置 ====================
const PORT = process.env.SCRAPER_PORT || 3100;
const STORAGE_DIR = path_1.default.join(__dirname, '..', 'storage');
// 确保存储目录存在
const storageDirs = ['videos', 'music', 'images', 'svg', 'thumbnails'];
storageDirs.forEach(dir => {
    const fullPath = path_1.default.join(STORAGE_DIR, dir);
    if (!fs_1.default.existsSync(fullPath)) {
        fs_1.default.mkdirSync(fullPath, { recursive: true });
    }
});
// ==================== 爬虫实例 ====================
const mixkitScraper = new mixkit_1.MixkitScraper();
const incompetechMusic = new incompetech_1.IncompetechMusic();
const pexelsScraper = new pexels_1.PexelsScraper();
const ytdlpWrapper = new ytdlp_1.YtDlpWrapper();
// ==================== Express 应用 ====================
const app = (0, express_1.default)();
// 中间件
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: '*', // 允许所有来源（盒子内访问）
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// 静态文件服务 - 提供下载的素材
app.use('/storage', express_1.default.static(STORAGE_DIR));
// ==================== API 路由 ====================
/**
 * 服务状态
 */
app.get('/api/status', async (req, res) => {
    try {
        const ytdlpAvailable = await ytdlpWrapper.checkAvailability();
        // 统计存储文件数量
        const countFiles = (dir) => {
            const fullPath = path_1.default.join(STORAGE_DIR, dir);
            if (!fs_1.default.existsSync(fullPath))
                return 0;
            return fs_1.default.readdirSync(fullPath).filter(f => !f.startsWith('.')).length;
        };
        res.json({
            status: 'running',
            version: '1.0.0',
            port: PORT,
            ytdlp: ytdlpAvailable,
            storage: {
                videos: countFiles('videos'),
                music: countFiles('music'),
                images: countFiles('images'),
                svg: countFiles('svg'),
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
/**
 * 搜索视频素材
 */
app.post('/api/search/video', async (req, res) => {
    try {
        const { query, source = 'mixkit', maxResults = 10 } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'query is required' });
        }
        console.log(`[Search Video] query="${query}", source="${source}", maxResults=${maxResults}`);
        let results = [];
        if (source === 'mixkit') {
            try {
                results = await mixkitScraper.searchVideos(query, maxResults);
            }
            catch (scraperError) {
                console.error('[Mixkit Scraper Error]', scraperError);
                return res.status(500).json({
                    success: false,
                    error: `Mixkit scraper failed: ${String(scraperError)}`,
                    suggestion: 'Playwright browser may not be installed. Run: npx playwright install chromium'
                });
            }
        }
        else {
            return res.status(400).json({ error: `Unsupported source: ${source}` });
        }
        console.log(`[Search Video] Found ${results.length} results`);
        res.json({
            success: true,
            query,
            source,
            count: results.length,
            results
        });
    }
    catch (error) {
        console.error('Video search error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});
/**
 * 搜索图片素材
 */
app.post('/api/search/image', async (req, res) => {
    try {
        const { query, source = 'pexels', maxResults = 10 } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'query is required' });
        }
        console.log(`[Search Image] query="${query}", source="${source}", maxResults=${maxResults}`);
        let results = [];
        if (source === 'pexels') {
            try {
                results = await pexelsScraper.searchImages(query, maxResults);
            }
            catch (scraperError) {
                console.error('[Pexels Scraper Error]', scraperError);
                return res.status(500).json({
                    success: false,
                    error: `Pexels scraper failed: ${String(scraperError)}`,
                    suggestion: 'Playwright browser may not be installed. Run: npx playwright install chromium'
                });
            }
        }
        else {
            return res.status(400).json({ error: `Unsupported source: ${source}` });
        }
        console.log(`[Search Image] Found ${results.length} results`);
        res.json({
            success: true,
            query,
            source,
            count: results.length,
            results
        });
    }
    catch (error) {
        console.error('Image search error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});
/**
 * 搜索音乐素材
 */
app.post('/api/search/music', async (req, res) => {
    try {
        const { query, source = 'incompetech', genre, mood, maxResults = 10 } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'query is required' });
        }
        let results = [];
        if (source === 'incompetech') {
            results = await incompetechMusic.search(query, { genre, mood, maxResults });
        }
        else if (source === 'mixkit') {
            results = await mixkitScraper.searchMusic(query, maxResults);
        }
        else {
            return res.status(400).json({ error: `Unsupported source: ${source}` });
        }
        res.json({
            success: true,
            query,
            source,
            count: results.length,
            results
        });
    }
    catch (error) {
        console.error('Music search error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});
/**
 * 统一媒体搜索 API
 *
 * 📝 用途：统一的媒体搜索接口，支持视频、音乐、图片
 * ✅ 替代原有的 search_stock_video 和 search_stock_music
 */
app.post('/api/search/media', async (req, res) => {
    try {
        const { query, type = 'all', maxResults = 10 } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'query is required' });
        }
        console.log(`[Search Media] query="${query}", type="${type}", maxResults=${maxResults}`);
        const results = { videos: [], music: [], images: [] };
        const errors = [];
        // 搜索视频
        if (type === 'all' || type === 'video') {
            try {
                const videoResults = await mixkitScraper.searchVideos(query, maxResults);
                results.videos = videoResults.map(v => ({ ...v, source: 'mixkit' }));
            }
            catch (e) {
                errors.push(`video: ${e.message}`);
            }
        }
        // 搜索音乐
        if (type === 'all' || type === 'music') {
            try {
                // 同时搜索 Mixkit 和 Incompetech
                const [mixkitMusic, incompetechResults] = await Promise.all([
                    mixkitScraper.searchMusic(query, Math.ceil(maxResults / 2)).catch(() => []),
                    incompetechMusic.search(query, { maxResults: Math.ceil(maxResults / 2) }).catch(() => [])
                ]);
                results.music = [
                    ...mixkitMusic.map(m => ({ ...m, source: 'mixkit' })),
                    ...incompetechResults.map(m => ({ ...m, source: 'incompetech' }))
                ];
            }
            catch (e) {
                errors.push(`music: ${e.message}`);
            }
        }
        // 搜索图片
        if (type === 'all' || type === 'image') {
            try {
                const imageResults = await pexelsScraper.searchImages(query, maxResults);
                results.images = imageResults.map(i => ({ ...i, source: 'pexels' }));
            }
            catch (e) {
                errors.push(`image: ${e.message}`);
            }
        }
        const totalCount = results.videos.length + results.music.length + results.images.length;
        console.log(`[Search Media] Found ${totalCount} results (${results.videos.length} videos, ${results.music.length} music, ${results.images.length} images)`);
        res.json({
            success: true,
            query,
            type,
            counts: {
                videos: results.videos.length,
                music: results.music.length,
                images: results.images.length,
                total: totalCount
            },
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        console.error('Media search error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});
/**
 * 下载素材到本地
 */
app.post('/api/download', async (req, res) => {
    try {
        const { url, type = 'video', filename } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'url is required' });
        }
        // 调用现有的下载工具
        const result = await (0, toolHandler_1.handleToolCall)('download_media', {
            url,
            type,
            filename
        }, null);
        if (result.isError) {
            const firstContent = result.content[0];
            const errorText = firstContent && 'text' in firstContent ? firstContent.text : 'Unknown error';
            return res.status(500).json({ success: false, error: errorText });
        }
        const firstContent = result.content[0];
        const responseText = firstContent && 'text' in firstContent ? firstContent.text : '{}';
        const data = JSON.parse(responseText);
        // 转换本地路径为 HTTP URL
        // 处理 Windows 绝对路径和相对路径
        let normalizedPath = data.localPath?.replace(/\\/g, '/') || '';
        // 检查是否是绝对路径（包含 storage 目录）
        const storageIndex = normalizedPath.indexOf('/storage/');
        if (storageIndex !== -1) {
            // 从 /storage/ 开始截取
            normalizedPath = normalizedPath.substring(storageIndex);
        }
        else if (normalizedPath.startsWith('./storage')) {
            normalizedPath = normalizedPath.replace('./storage', '/storage');
        }
        else if (normalizedPath.startsWith('storage')) {
            normalizedPath = '/' + normalizedPath;
        }
        const localUrl = `http://localhost:${PORT}${normalizedPath}`;
        res.json({
            success: true,
            localPath: data.localPath,
            localUrl,
            size: data.size,
            filename: normalizedPath.split('/').pop() || filename || 'unknown',
            type
        });
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});
/**
 * 视频平台下载 (yt-dlp)
 */
app.post('/api/ytdlp', async (req, res) => {
    try {
        const { url, format = 'best', audioOnly = false, filename } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'url is required' });
        }
        // 检查 yt-dlp 是否可用
        const isAvailable = await ytdlpWrapper.checkAvailability();
        if (!isAvailable) {
            return res.status(503).json({
                success: false,
                error: 'yt-dlp is not installed. Please install it with: pip install yt-dlp'
            });
        }
        // 下载视频
        const result = await ytdlpWrapper.download(url, {
            outputDir: path_1.default.join(STORAGE_DIR, 'videos'),
            format,
            audioOnly
        });
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        // 转换本地路径为 HTTP URL
        const localUrl = `http://localhost:${PORT}/storage/videos/${path_1.default.basename(result.localPath || '')}`;
        res.json({
            success: true,
            localPath: result.localPath,
            localUrl,
            title: result.title,
            duration: result.duration
        });
    }
    catch (error) {
        console.error('yt-dlp error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});
/**
 * 获取视频信息（不下载）
 */
app.post('/api/ytdlp/info', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'url is required' });
        }
        const isAvailable = await ytdlpWrapper.checkAvailability();
        if (!isAvailable) {
            return res.status(503).json({
                success: false,
                error: 'yt-dlp is not installed'
            });
        }
        const info = await ytdlpWrapper.getVideoInfo(url);
        res.json({
            success: true,
            info
        });
    }
    catch (error) {
        console.error('yt-dlp info error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});
/**
 * 列出已下载的文件
 */
app.get('/api/files/:type', (req, res) => {
    try {
        const { type } = req.params;
        const validTypes = ['videos', 'music', 'images', 'svg'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        }
        const dirPath = path_1.default.join(STORAGE_DIR, type);
        if (!fs_1.default.existsSync(dirPath)) {
            return res.json({ files: [] });
        }
        const files = fs_1.default.readdirSync(dirPath)
            .filter(f => !f.startsWith('.'))
            .map(f => {
            const filePath = path_1.default.join(dirPath, f);
            const stats = fs_1.default.statSync(filePath);
            return {
                name: f,
                size: stats.size,
                url: `http://localhost:${PORT}/storage/${type}/${f}`,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime
            };
        });
        res.json({ files });
    }
    catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
/**
 * 删除已下载的文件
 */
app.delete('/api/files/:type/:filename', (req, res) => {
    try {
        const { type, filename } = req.params;
        const validTypes = ['videos', 'music', 'images', 'svg'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid type' });
        }
        // 安全检查：防止路径遍历
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        const filePath = path_1.default.join(STORAGE_DIR, type, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        fs_1.default.unlinkSync(filePath);
        res.json({ success: true, message: `Deleted ${filename}` });
    }
    catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
// ==================== 全局错误处理 ====================
process.on('uncaughtException', (error) => {
    console.error('[Uncaught Exception]', error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]', reason);
});
// ==================== 启动服务器 ====================
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           V-Editor Scraper HTTP Server                     ║
╠════════════════════════════════════════════════════════════╣
║  Status:  Running                                          ║
║  Port:    ${PORT}                                             ║
║  Storage: ${STORAGE_DIR}
╠════════════════════════════════════════════════════════════╣
║  API Endpoints:                                            ║
║  - GET  /api/status          服务状态                      ║
║  - POST /api/search/media    统一媒体搜索 ⭐               ║
║  - POST /api/search/video    搜索视频                      ║
║  - POST /api/search/image    搜索图片                      ║
║  - POST /api/search/music    搜索音乐                      ║
║  - POST /api/download        下载素材                      ║
║  - POST /api/ytdlp           视频平台下载                  ║
║  - POST /api/ytdlp/info      获取视频信息                  ║
║  - GET  /api/files/:type     列出已下载文件                ║
║  - GET  /storage/*           静态文件服务                  ║
╚════════════════════════════════════════════════════════════╝
  `);
});
exports.default = app;
//# sourceMappingURL=server.js.map