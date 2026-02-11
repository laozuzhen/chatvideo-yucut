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
import { BaseScraper } from './base';
import type { MediaResult, SearchOptions, ScraperConfig } from './types';
/**
 * Mixkit 爬虫类
 */
export declare class MixkitScraper extends BaseScraper {
    private baseUrl;
    constructor(config?: ScraperConfig);
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
    searchVideos(query: string, maxResults?: number): Promise<MediaResult[]>;
    /**
     * 搜索音乐（使用 JSON-LD 解析，无需 JavaScript 渲染）
     *
     * Mixkit 音乐搜索 URL 格式：https://mixkit.co/free-stock-music/mood/{keyword}/
     * 页面包含 JSON-LD 结构化数据，可直接提取音乐信息和 MP3 下载链接
     */
    searchMusic(query: string, maxResults?: number): Promise<MediaResult[]>;
    /**
     * 搜索音效
     */
    searchSoundEffects(query: string, maxResults?: number): Promise<MediaResult[]>;
    /**
     * 获取视频下载链接
     * 需要访问详情页获取实际下载链接
     */
    getVideoDownloadUrl(detailUrl: string): Promise<string | null>;
    /**
     * 通用搜索方法（实现 IScraper 接口）
     */
    search(query: string, options?: SearchOptions): Promise<MediaResult[]>;
}
export default MixkitScraper;
//# sourceMappingURL=mixkit.d.ts.map