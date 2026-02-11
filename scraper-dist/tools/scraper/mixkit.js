"use strict";
/**
 * Mixkit 爬虫
 *
 * Mixkit 是 Envato 旗下的免费素材平台，提供视频、音乐、音效等资源
 *
 * 网站结构：
 * - 视频搜索页：https://mixkit.co/free-stock-video/{keyword}/
 * - 音乐搜索页：https://mixkit.co/free-stock-music/mood/{keyword}/
 * - 音效搜索页：https://mixkit.co/free-sound-effects/{keyword}/
 *
 * 实现策略：
 * - 音乐搜索：使用 JSON-LD 结构化数据解析（无需 JavaScript 渲染）
 * - 视频搜索：使用 Playwright 爬虫（需要 JavaScript 渲染）
 *
 * @see https://mixkit.co
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixkitScraper = void 0;
const crawlee_1 = require("crawlee");
const base_1 = require("./base");
/**
 * Mixkit 爬虫类
 */
class MixkitScraper extends base_1.BaseScraper {
    constructor(config = {}) {
        super({
            minDelay: 2000,
            maxDelay: 5000,
            headless: true,
            maxConcurrency: 1,
            timeoutSecs: 60,
            maxRetries: 3,
            ...config,
        });
        this.baseUrl = 'https://mixkit.co';
    }
    /**
     * 搜索视频（使用 JSON-LD 解析，无需 JavaScript 渲染）
     *
     * Mixkit 视频搜索 URL 格式：https://mixkit.co/free-stock-video/{keyword}/
     * 页面包含 JSON-LD 结构化数据，包含 VideoObject 类型
     *
     * JSON-LD 结构：
     * - @type: "ItemList" - 包含视频 ID 列表
     * - @type: "VideoObject" - 包含视频详细信息（name, description, thumbnailUrl, contentUrl）
     */
    async searchVideos(query, maxResults = 20) {
        const results = [];
        const searchUrl = `${this.baseUrl}/free-stock-video/${encodeURIComponent(query.replace(/\s+/g, '-'))}/`;
        try {
            // 使用 fetch 获取页面 HTML（无需 JavaScript 渲染）
            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': this.getRandomUA(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const html = await response.text();
            // 提取所有 JSON-LD 脚本标签
            const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
            for (const match of jsonLdMatches) {
                try {
                    const jsonLd = JSON.parse(match[1]);
                    // 查找 @graph 中的 VideoObject
                    if (jsonLd['@graph']) {
                        for (const node of jsonLd['@graph']) {
                            if (results.length >= maxResults)
                                break;
                            if (node['@type'] !== 'VideoObject')
                                continue;
                            const video = node;
                            // 从 @id 提取视频 ID（格式：https://mixkit.co/free-stock-video/xxx-12345/#video）
                            const idMatch = video['@id']?.match(/-(\d+)\/#video$/);
                            const id = idMatch ? idMatch[1] : '';
                            if (id && video.contentUrl) {
                                results.push({
                                    id: `mixkit_video_${id}`,
                                    title: video.name || '',
                                    description: video.description,
                                    url: video.contentUrl, // 1080p 下载链接
                                    detailUrl: video['@id']?.replace('/#video', '') || '',
                                    previewUrl: video.embedUrl || video.contentUrl, // 360p 预览链接
                                    thumbnailUrl: video.thumbnailUrl || '',
                                    type: 'video',
                                    source: 'mixkit',
                                    license: 'Mixkit License (Free for commercial use)',
                                    tags: video.videoQuality || [],
                                });
                            }
                        }
                    }
                }
                catch {
                    // 忽略单个 JSON-LD 解析错误，继续处理下一个
                }
            }
            return results.slice(0, maxResults);
        }
        catch (error) {
            console.error(`Mixkit video search failed: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * 搜索音乐（使用 JSON-LD 解析，无需 JavaScript 渲染）
     *
     * Mixkit 音乐搜索 URL 格式：https://mixkit.co/free-stock-music/mood/{keyword}/
     * 页面包含 JSON-LD 结构化数据，可直接提取音乐信息和 MP3 下载链接
     */
    async searchMusic(query, maxResults = 20) {
        const results = [];
        const searchUrl = `${this.baseUrl}/free-stock-music/mood/${encodeURIComponent(query.replace(/\s+/g, '-'))}/`;
        try {
            // 使用 fetch 获取页面 HTML（无需 JavaScript 渲染）
            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': this.getRandomUA(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const html = await response.text();
            // 提取所有 JSON-LD 脚本标签
            const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
            for (const match of jsonLdMatches) {
                try {
                    const jsonLd = JSON.parse(match[1]);
                    // 查找 ItemList 类型的图节点
                    const itemList = jsonLd['@graph']?.find((node) => node['@type'] === 'ItemList' && 'itemListElement' in node);
                    if (itemList?.itemListElement) {
                        for (const item of itemList.itemListElement) {
                            if (results.length >= maxResults)
                                break;
                            if (item['@type'] !== 'MusicRecording')
                                continue;
                            // 从 URL 提取 ID（格式：https://assets.mixkit.co/music/839/839.mp3）
                            const idMatch = item.url.match(/\/music\/(\d+)\//);
                            const id = idMatch ? idMatch[1] : item['@id'];
                            results.push({
                                id: `mixkit_music_${id}`,
                                title: item.name,
                                url: item.url, // 直接 MP3 下载链接
                                previewUrl: item.url,
                                duration: parseIsoDuration(item.duration),
                                type: 'music',
                                source: 'mixkit',
                                license: 'Mixkit License (Free for commercial use)',
                                author: item.byArtist,
                                tags: item.genre ? [item.genre] : [],
                            });
                        }
                    }
                }
                catch {
                    // 忽略单个 JSON-LD 解析错误，继续处理下一个
                }
            }
            return results.slice(0, maxResults);
        }
        catch (error) {
            console.error(`Mixkit music search failed: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * 搜索音效
     */
    async searchSoundEffects(query, maxResults = 20) {
        const results = [];
        const searchUrl = `${this.baseUrl}/free-sound-effects/${encodeURIComponent(query.replace(/\s+/g, '-'))}/`;
        const crawlerConfig = this.config;
        const userAgent = this.getRandomUA();
        const crawler = new crawlee_1.PlaywrightCrawler({
            async requestHandler({ page, request, log }) {
                log.info(`Processing ${request.url}`);
                await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { });
                await page.waitForSelector('[class*="item-grid"], [class*="sound-item"], .sfx-item', { timeout: 10000 }).catch(() => { });
                await autoScroll(page, 3);
                const cards = await page.evaluate(() => {
                    const items = [];
                    const cardElements = document.querySelectorAll('[class*="item-grid__item"], .sound-item, .sfx-item, article[class*="item"]');
                    cardElements.forEach((card) => {
                        try {
                            const linkEl = card.querySelector('a[href*="/free-sound-effects/"]');
                            if (!linkEl)
                                return;
                            const titleEl = card.querySelector('[class*="title"], h3, h4, .item-title');
                            const title = titleEl?.textContent?.trim() || '';
                            const downloadEl = card.querySelector('a[href*="download"], a[class*="download"]');
                            const downloadUrl = downloadEl?.href || '';
                            const audioEl = card.querySelector('audio');
                            const previewUrl = audioEl?.src || audioEl?.querySelector('source')?.src || '';
                            const durationEl = card.querySelector('[class*="duration"], .time, span[class*="time"]');
                            const duration = durationEl?.textContent?.trim() || '';
                            const tagEls = card.querySelectorAll('[class*="tag"], .tag');
                            const tags = Array.from(tagEls).map(t => t.textContent?.trim() || '').filter(Boolean);
                            if (linkEl.href && title) {
                                items.push({
                                    title,
                                    detailUrl: linkEl.href,
                                    previewUrl,
                                    downloadUrl,
                                    duration,
                                    author: '',
                                    tags,
                                });
                            }
                        }
                        catch {
                            // 忽略单个卡片解析错误
                        }
                    });
                    return items;
                });
                for (const card of cards) {
                    if (results.length >= maxResults)
                        break;
                    const idMatch = card.detailUrl.match(/\/free-sound-effects\/([^/]+)-(\d+)\/?$/);
                    const id = idMatch ? idMatch[2] : card.detailUrl.split('/').filter(Boolean).pop() || '';
                    results.push({
                        id: `mixkit_sfx_${id}`,
                        title: card.title,
                        url: card.downloadUrl || card.detailUrl,
                        previewUrl: card.previewUrl,
                        duration: parseDurationString(card.duration),
                        type: 'sound-effect',
                        source: 'mixkit',
                        license: 'Mixkit License (Free for commercial use)',
                        tags: card.tags,
                    });
                }
            },
            async failedRequestHandler({ request, error }) {
                const err = error;
                console.error(`Request ${request.url} failed: ${err.message}`);
            },
            maxRequestsPerCrawl: 1,
            maxConcurrency: crawlerConfig.maxConcurrency,
            navigationTimeoutSecs: crawlerConfig.timeoutSecs,
            requestHandlerTimeoutSecs: crawlerConfig.timeoutSecs * 2,
            headless: crawlerConfig.headless,
            launchContext: {
                launchOptions: {
                    headless: crawlerConfig.headless,
                    args: [
                        '--disable-blink-features=AutomationControlled',
                        '--disable-web-security',
                        '--no-sandbox',
                    ],
                },
            },
            preNavigationHooks: [
                async ({ page }) => {
                    await page.setExtraHTTPHeaders({
                        'User-Agent': userAgent,
                        'Accept-Language': 'en-US,en;q=0.9',
                    });
                    await page.addInitScript(() => {
                        Object.defineProperty(navigator, 'webdriver', { get: () => false });
                    });
                },
            ],
        });
        await this.randomDelay();
        await crawler.run([searchUrl]);
        return results.slice(0, maxResults);
    }
    /**
     * 获取视频下载链接
     * 需要访问详情页获取实际下载链接
     */
    async getVideoDownloadUrl(detailUrl) {
        let downloadUrl = null;
        const crawlerConfig = this.config;
        const userAgent = this.getRandomUA();
        const crawler = new crawlee_1.PlaywrightCrawler({
            async requestHandler({ page, log }) {
                log.info(`Getting download URL from ${detailUrl}`);
                await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { });
                const downloadBtn = await page.$('a[href*="download"], a[class*="download-button"], button[class*="download"]');
                if (downloadBtn) {
                    downloadUrl = await downloadBtn.getAttribute('href');
                }
                if (!downloadUrl) {
                    downloadUrl = await page.evaluate(() => {
                        const video = document.querySelector('video');
                        if (video) {
                            const source = video.querySelector('source');
                            return source?.src || video.src || null;
                        }
                        return null;
                    });
                }
            },
            maxRequestsPerCrawl: 1,
            headless: crawlerConfig.headless,
            navigationTimeoutSecs: crawlerConfig.timeoutSecs,
            launchContext: {
                launchOptions: {
                    headless: crawlerConfig.headless,
                    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
                },
            },
            preNavigationHooks: [
                async ({ page }) => {
                    await page.setExtraHTTPHeaders({
                        'User-Agent': userAgent,
                    });
                },
            ],
        });
        await this.randomDelay();
        await crawler.run([detailUrl]);
        return downloadUrl;
    }
    /**
     * 通用搜索方法（实现 IScraper 接口）
     */
    async search(query, options = {}) {
        return this.searchVideos(query, options.maxResults || 20);
    }
}
exports.MixkitScraper = MixkitScraper;
/**
 * 自动滚动页面以加载更多内容
 */
async function autoScroll(page, scrollTimes = 3) {
    for (let i = 0; i < scrollTimes; i++) {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await page.waitForTimeout(1000);
    }
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
}
/**
 * 解析时长字符串为秒数
 */
function parseDurationString(durationStr) {
    if (!durationStr)
        return 0;
    const cleaned = durationStr.trim().replace(/[^\d:]/g, '');
    if (!cleaned)
        return 0;
    const parts = cleaned.split(':').map(p => parseInt(p, 10) || 0);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    else if (parts.length === 1) {
        return parts[0];
    }
    return 0;
}
/**
 * 解析 ISO 8601 时长格式为秒数
 * 格式：PT2M20S（2分20秒）、PT1H30M（1小时30分）
 */
function parseIsoDuration(isoDuration) {
    if (!isoDuration)
        return 0;
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match)
        return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
}
exports.default = MixkitScraper;
//# sourceMappingURL=mixkit.js.map