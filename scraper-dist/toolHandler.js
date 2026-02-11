"use strict";
/**
 * V-Editor Scraper - Tool Handler
 *
 * 📝 用途：处理 MCP 工具调用，分发到具体的爬虫实现
 * ✅ 纯爬虫实现，无需 API Key
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConsoleLogs = getConsoleLogs;
exports.getScreenshots = getScreenshots;
exports.resetBrowserState = resetBrowserState;
exports.handleToolCall = handleToolCall;
exports.cleanup = cleanup;
const playwright_1 = require("playwright");
const types_js_1 = require("./tools/common/types.js");
const mixkit_js_1 = require("./tools/scraper/mixkit.js");
const incompetech_js_1 = require("./tools/scraper/incompetech.js");
const ytdlp_js_1 = require("./tools/video-platform/ytdlp.js");
const duckduckgo_images_js_1 = require("./tools/scraper/duckduckgo-images.js");
const icrawler_bridge_js_1 = require("./tools/scraper/icrawler-bridge.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
// ==================== 全局状态 ====================
// 浏览器状态
let browser = null;
let page = null;
// 控制台日志和截图存储
const consoleLogs = [];
const screenshots = new Map();
// 爬虫实例（懒加载）
let mixkitScraper = null;
let incompetechMusic = null;
let ytdlpWrapper = null;
let duckduckgoImages = null;
// ==================== 导出函数 ====================
function getConsoleLogs() {
    return consoleLogs;
}
function getScreenshots() {
    return screenshots;
}
function resetBrowserState() {
    browser = null;
    page = null;
}
// ==================== 爬虫实例获取 ====================
function getMixkitScraper() {
    if (!mixkitScraper) {
        mixkitScraper = new mixkit_js_1.MixkitScraper();
    }
    return mixkitScraper;
}
function getIncompetechMusic() {
    if (!incompetechMusic) {
        incompetechMusic = new incompetech_js_1.IncompetechMusic();
    }
    return incompetechMusic;
}
function getYtDlpWrapper() {
    if (!ytdlpWrapper) {
        ytdlpWrapper = new ytdlp_js_1.YtDlpWrapper();
    }
    return ytdlpWrapper;
}
function getDuckDuckGoImages() {
    if (!duckduckgoImages) {
        duckduckgoImages = new duckduckgo_images_js_1.DuckDuckGoImagesScraper();
    }
    return duckduckgoImages;
}
// ==================== 浏览器管理 ====================
async function ensureBrowser() {
    if (!browser || !browser.isConnected()) {
        browser = await playwright_1.chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        // Setup console logging
        page.on('console', (msg) => {
            consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
            // 限制日志数量
            if (consoleLogs.length > 1000) {
                consoleLogs.shift();
            }
        });
    }
    if (!page || page.isClosed()) {
        page = await browser.newPage();
    }
    return { browser, page };
}
// ==================== 主处理函数 ====================
async function handleToolCall(name, args, server) {
    try {
        switch (name) {
            // ==================== 统一媒体搜索工具 ====================
            case 'search_media':
                return await searchMedia(args);
            // ==================== 视频信息和下载工具 ====================
            case 'get_video_info':
                return await getVideoInfo(args);
            case 'download_video':
                return await downloadVideo(args);
            // ==================== 通用下载工具 ====================
            case 'download_media':
                return await downloadMedia(args);
            // ==================== 浏览器控制（保留兼容性） ====================
            case 'browser_navigate':
                return await browserNavigate(args);
            case 'browser_screenshot':
                return await browserScreenshot(args);
            case 'browser_close':
                return await browserClose();
            default:
                return (0, types_js_1.createErrorResponse)(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        consoleLogs.push(`[error] Tool ${name} failed: ${errorMessage}`);
        return (0, types_js_1.createErrorResponse)(`Tool execution failed: ${errorMessage}`);
    }
}
async function searchMixkitVideos(args) {
    const { query, maxResults = 20 } = args;
    try {
        const scraper = getMixkitScraper();
        const results = await scraper.searchVideos(query, maxResults);
        consoleLogs.push(`[info] Mixkit video search: "${query}" returned ${results.length} results`);
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            query,
            count: results.length,
            results
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Mixkit video search failed: ${errorMessage}`);
    }
}
async function searchMixkitMusic(args) {
    const { query, maxResults = 20 } = args;
    try {
        const scraper = getMixkitScraper();
        const results = await scraper.searchMusic(query, maxResults);
        consoleLogs.push(`[info] Mixkit music search: "${query}" returned ${results.length} results`);
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            query,
            count: results.length,
            results
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Mixkit music search failed: ${errorMessage}`);
    }
}
async function searchIncompetechMusic(args) {
    const { query, genre, mood, maxResults = 20 } = args;
    try {
        const music = getIncompetechMusic();
        const results = await music.search(query, { genre, mood, maxResults });
        consoleLogs.push(`[info] Incompetech search: "${query}" returned ${results.length} results`);
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            query,
            filters: { genre, mood },
            count: results.length,
            results
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Incompetech search failed: ${errorMessage}`);
    }
}
async function searchYouTube(args) {
    const { query, maxResults = 10, sortBy = 'relevance' } = args;
    try {
        const ytdlp = getYtDlpWrapper();
        // 检查 yt-dlp 是否可用
        const isAvailable = await ytdlp.checkAvailability();
        if (!isAvailable) {
            return (0, types_js_1.createErrorResponse)('yt-dlp is not installed. Please install it with: pip install yt-dlp');
        }
        const results = await ytdlp.search('youtube', query, maxResults, sortBy);
        consoleLogs.push(`[info] YouTube search: "${query}" returned ${results.length} results`);
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            platform: 'youtube',
            query,
            sortBy,
            count: results.length,
            results
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`YouTube search failed: ${errorMessage}`);
    }
}
async function searchBilibili(args) {
    const { query, maxResults = 10 } = args;
    try {
        const ytdlp = getYtDlpWrapper();
        const isAvailable = await ytdlp.checkAvailability();
        if (!isAvailable) {
            return (0, types_js_1.createErrorResponse)('yt-dlp is not installed. Please install it with: pip install yt-dlp');
        }
        const results = await ytdlp.search('bilibili', query, maxResults);
        consoleLogs.push(`[info] Bilibili search: "${query}" returned ${results.length} results`);
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            platform: 'bilibili',
            query,
            count: results.length,
            results
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Bilibili search failed: ${errorMessage}`);
    }
}
async function getVideoInfo(args) {
    const { url } = args;
    try {
        const ytdlp = getYtDlpWrapper();
        // 先检查 yt-dlp 是否可用
        const isAvailable = await ytdlp.checkAvailability();
        if (!isAvailable) {
            return (0, types_js_1.createErrorResponse)('yt-dlp is not installed. Please install it with: pip install yt-dlp');
        }
        const info = await ytdlp.getVideoInfo(url);
        consoleLogs.push(`[info] Video info retrieved: "${info.title}" (${info.platform})`);
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            info
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Failed to get video info: ${errorMessage}`);
    }
}
async function downloadVideo(args) {
    const { url, format = 'best', audioOnly = false, outputDir } = args;
    try {
        const ytdlp = getYtDlpWrapper();
        // 先检查 yt-dlp 是否可用
        const isAvailable = await ytdlp.checkAvailability();
        if (!isAvailable) {
            return (0, types_js_1.createErrorResponse)('yt-dlp is not installed. Please install it with: pip install yt-dlp');
        }
        const result = await ytdlp.download(url, {
            outputDir: outputDir || './storage/videos',
            format,
            audioOnly
        });
        if (result.success) {
            consoleLogs.push(`[info] Video downloaded: "${result.title}" -> ${result.localPath}`);
            return (0, types_js_1.createSuccessResponse)(JSON.stringify({
                status: 'success',
                result
            }, null, 2));
        }
        else {
            return (0, types_js_1.createErrorResponse)(`Download failed: ${result.error}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Failed to download video: ${errorMessage}`);
    }
}
async function searchImages(args) {
    const { query, source = 'auto', maxResults = 20 } = args;
    try {
        let results = [];
        let usedSource = source;
        // 优先使用 icrawler（Bing/Baidu 在中国大陆可用）
        if (source === 'auto' || source === 'bing' || source === 'baidu') {
            const engine = source === 'auto' ? 'bing' : source;
            try {
                const icrawlerResult = await (0, icrawler_bridge_js_1.searchImagesWithICrawler)({
                    engine,
                    keyword: query,
                    maxNum: maxResults
                });
                if (icrawlerResult.success && icrawlerResult.files.length > 0) {
                    results = icrawlerResult.files.map((file, index) => ({
                        id: `${engine}_image_${index}_${Date.now()}`,
                        title: file.filename,
                        localPath: file.path,
                        size: file.size,
                        source: engine,
                        type: 'local_file'
                    }));
                    usedSource = engine;
                    consoleLogs.push(`[info] Image search (${engine}): "${query}" downloaded ${results.length} images to ${icrawlerResult.temp_dir}`);
                    return (0, types_js_1.createSuccessResponse)(JSON.stringify({
                        status: 'success',
                        source: usedSource,
                        query,
                        count: results.length,
                        tempDir: icrawlerResult.temp_dir,
                        results
                    }, null, 2));
                }
            }
            catch (icrawlerError) {
                consoleLogs.push(`[warn] icrawler (${engine}) failed: ${icrawlerError instanceof Error ? icrawlerError.message : String(icrawlerError)}`);
                // 继续尝试 DuckDuckGo
            }
        }
        // 回退到 DuckDuckGo（需要代理）
        if (results.length === 0 && (source === 'auto' || source === 'duckduckgo')) {
            try {
                const ddg = getDuckDuckGoImages();
                const ddgResults = await ddg.searchImages(query, { maxResults });
                if (ddgResults.length > 0) {
                    results = ddgResults.map((img, index) => ({
                        id: `duckduckgo_image_${index}_${Date.now()}`,
                        title: img.title,
                        image: img.image,
                        thumbnail: img.thumbnail,
                        url: img.url,
                        width: img.width,
                        height: img.height,
                        source: 'duckduckgo',
                        type: 'url'
                    }));
                    usedSource = 'duckduckgo';
                    consoleLogs.push(`[info] Image search (duckduckgo): "${query}" returned ${results.length} results`);
                }
            }
            catch (ddgError) {
                consoleLogs.push(`[warn] DuckDuckGo failed: ${ddgError instanceof Error ? ddgError.message : String(ddgError)}`);
            }
        }
        if (results.length === 0) {
            return (0, types_js_1.createErrorResponse)(`Image search failed: No results found for "${query}". Try a different search source or check your network connection.`);
        }
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            source: usedSource,
            query,
            count: results.length,
            results
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Image search failed: ${errorMessage}`);
    }
}
async function searchMedia(args) {
    const { query, type = 'all', sources, maxResults = 10, chinaMainlandOnly = true } = args;
    const results = { videos: [], music: [], images: [] };
    const errors = [];
    try {
        // 确定要搜索的源
        const videoSources = sources?.filter(s => ['mixkit', 'youtube', 'bilibili'].includes(s))
            || (chinaMainlandOnly ? ['mixkit', 'bilibili'] : ['mixkit', 'youtube', 'bilibili']);
        const musicSources = sources?.filter(s => ['mixkit', 'incompetech'].includes(s))
            || ['mixkit', 'incompetech'];
        const imageSources = sources?.filter(s => ['bing', 'baidu', 'duckduckgo'].includes(s))
            || (chinaMainlandOnly ? ['bing', 'baidu'] : ['bing', 'baidu', 'duckduckgo']);
        // 搜索视频
        if (type === 'all' || type === 'video') {
            for (const source of videoSources) {
                try {
                    if (source === 'mixkit') {
                        const scraper = getMixkitScraper();
                        const r = await scraper.searchVideos(query, maxResults);
                        results.videos.push(...r.map(v => ({ ...v, source: 'mixkit' })));
                    }
                    else if (source === 'youtube' && !chinaMainlandOnly) {
                        const ytdlp = getYtDlpWrapper();
                        if (await ytdlp.checkAvailability()) {
                            const r = await ytdlp.search('youtube', query, maxResults);
                            results.videos.push(...r.map(v => ({ ...v, source: 'youtube' })));
                        }
                    }
                    else if (source === 'bilibili') {
                        const ytdlp = getYtDlpWrapper();
                        if (await ytdlp.checkAvailability()) {
                            const r = await ytdlp.search('bilibili', query, maxResults);
                            results.videos.push(...r.map(v => ({ ...v, source: 'bilibili' })));
                        }
                    }
                }
                catch (e) {
                    errors.push(`${source} video: ${e.message}`);
                }
            }
        }
        // 搜索音乐
        if (type === 'all' || type === 'music') {
            for (const source of musicSources) {
                try {
                    if (source === 'mixkit') {
                        const scraper = getMixkitScraper();
                        const r = await scraper.searchMusic(query, maxResults);
                        results.music.push(...r.map(m => ({ ...m, source: 'mixkit' })));
                    }
                    else if (source === 'incompetech') {
                        const music = getIncompetechMusic();
                        const r = await music.search(query, { maxResults });
                        results.music.push(...r.map(m => ({ ...m, source: 'incompetech' })));
                    }
                }
                catch (e) {
                    errors.push(`${source} music: ${e.message}`);
                }
            }
        }
        // 搜索图片
        if (type === 'all' || type === 'image') {
            for (const source of imageSources) {
                try {
                    if (source === 'bing' || source === 'baidu') {
                        const icrawlerResult = await (0, icrawler_bridge_js_1.searchImagesWithICrawler)({
                            engine: source,
                            keyword: query,
                            maxNum: maxResults
                        });
                        if (icrawlerResult.success && icrawlerResult.files.length > 0) {
                            results.images.push(...icrawlerResult.files.map((file, index) => ({
                                id: `${source}_image_${index}_${Date.now()}`,
                                title: file.filename,
                                localPath: file.path,
                                size: file.size,
                                source,
                                type: 'local_file'
                            })));
                        }
                    }
                    else if (source === 'duckduckgo' && !chinaMainlandOnly) {
                        const ddg = getDuckDuckGoImages();
                        const r = await ddg.searchImages(query, { maxResults });
                        results.images.push(...r.map((img, index) => ({
                            id: `duckduckgo_image_${index}_${Date.now()}`,
                            title: img.title,
                            image: img.image,
                            thumbnail: img.thumbnail,
                            url: img.url,
                            width: img.width,
                            height: img.height,
                            source: 'duckduckgo',
                            type: 'url'
                        })));
                    }
                }
                catch (e) {
                    errors.push(`${source} image: ${e.message}`);
                }
            }
        }
        const totalCount = results.videos.length + results.music.length + results.images.length;
        consoleLogs.push(`[info] Media search: "${query}" returned ${totalCount} results (${results.videos.length} videos, ${results.music.length} music, ${results.images.length} images)`);
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            query,
            type,
            chinaMainlandOnly,
            counts: {
                videos: results.videos.length,
                music: results.music.length,
                images: results.images.length,
                total: totalCount
            },
            results,
            errors: errors.length > 0 ? errors : undefined
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Media search failed: ${errorMessage}`);
    }
}
async function downloadMedia(args) {
    const { url, type, filename } = args;
    try {
        // 使用绝对路径，确保无论从哪里运行都能正确存储
        // __dirname 在编译后指向 dist/，所以需要回退到项目根目录
        const projectRoot = path.join(__dirname, '..');
        const storageRoot = path.join(projectRoot, 'storage');
        // 确定存储目录
        const typeToDir = {
            video: path.join(storageRoot, 'videos'),
            image: path.join(storageRoot, 'images'),
            music: path.join(storageRoot, 'music'),
            svg: path.join(storageRoot, 'svg')
        };
        const outputDir = typeToDir[type] || path.join(storageRoot, 'misc');
        // 确保目录存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // 生成文件名
        const urlObj = new URL(url);
        const ext = path.extname(urlObj.pathname) || getExtensionByType(type);
        const baseName = filename || `${type}_${Date.now()}`;
        const finalFilename = baseName.endsWith(ext) ? baseName : `${baseName}${ext}`;
        const localPath = path.join(outputDir, finalFilename);
        // 下载文件
        const result = await downloadFile(url, localPath);
        consoleLogs.push(`[info] Media downloaded: ${type} -> ${localPath} (${result.size} bytes)`);
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            localPath: result.localPath,
            size: result.size,
            type
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Failed to download media: ${errorMessage}`);
    }
}
/**
 * 下载文件到本地
 * 支持 HTTPS、重定向、自定义 User-Agent
 */
function downloadFile(url, localPath) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': `${urlObj.protocol}//${urlObj.hostname}/`,
            }
        };
        const file = fs.createWriteStream(localPath);
        const request = protocol.request(options, (response) => {
            // 处理重定向 (301, 302, 303, 307, 308)
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    file.close();
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                    }
                    // 处理相对 URL
                    const absoluteUrl = redirectUrl.startsWith('http')
                        ? redirectUrl
                        : new URL(redirectUrl, url).toString();
                    downloadFile(absoluteUrl, localPath).then(resolve).catch(reject);
                    return;
                }
            }
            if (response.statusCode !== 200) {
                file.close();
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
                reject(new Error(`HTTP ${response.statusCode}: Failed to download ${url}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                const stats = fs.statSync(localPath);
                resolve({
                    localPath,
                    size: stats.size
                });
            });
            file.on('error', (err) => {
                file.close();
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
                reject(err);
            });
        });
        request.on('error', (err) => {
            file.close();
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
            reject(err);
        });
        // 设置超时
        request.setTimeout(60000, () => {
            request.destroy();
            file.close();
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
            reject(new Error(`Download timeout: ${url}`));
        });
        request.end();
    });
}
/**
 * 根据媒体类型获取默认扩展名
 */
function getExtensionByType(type) {
    const typeToExt = {
        video: '.mp4',
        image: '.jpg',
        music: '.mp3',
        svg: '.svg'
    };
    return typeToExt[type] || '';
}
// ==================== 浏览器控制实现（保留兼容性） ====================
async function browserNavigate(args) {
    const { page } = await ensureBrowser();
    try {
        await page.goto(args.url, { waitUntil: 'networkidle' });
        const title = await page.title();
        consoleLogs.push(`[info] Navigated to: ${args.url}`);
        return (0, types_js_1.createSuccessResponse)(JSON.stringify({
            status: 'success',
            url: args.url,
            title
        }, null, 2));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Navigation failed: ${errorMessage}`);
    }
}
async function browserScreenshot(args) {
    const { page } = await ensureBrowser();
    try {
        const buffer = await page.screenshot({
            fullPage: args.fullPage || false,
            type: 'png'
        });
        const base64 = buffer.toString('base64');
        const name = `screenshot_${Date.now()}`;
        screenshots.set(name, base64);
        consoleLogs.push(`[info] Screenshot taken: ${name}`);
        return {
            content: [{
                    type: "image",
                    data: base64,
                    mimeType: "image/png"
                }],
            isError: false
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (0, types_js_1.createErrorResponse)(`Screenshot failed: ${errorMessage}`);
    }
}
async function browserClose() {
    if (browser) {
        await browser.close();
        resetBrowserState();
    }
    // 清理爬虫实例
    if (mixkitScraper) {
        if (typeof mixkitScraper.close === 'function') {
            await mixkitScraper.close();
        }
        mixkitScraper = null;
    }
    consoleLogs.push('[info] Browser and scrapers closed');
    return (0, types_js_1.createSuccessResponse)('Browser and scrapers closed');
}
// ==================== 清理函数 ====================
async function cleanup() {
    await browserClose();
    incompetechMusic = null;
    ytdlpWrapper = null;
    duckduckgoImages = null;
}
//# sourceMappingURL=toolHandler.js.map