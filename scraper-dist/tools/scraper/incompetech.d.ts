/**
 * Incompetech (Kevin MacLeod) 音乐搜索
 *
 * 📝 用途：搜索 Incompetech 免费音乐库
 * ✅ 使用官方公开 JSON 数据，无需爬虫
 *
 * Incompetech 是 Kevin MacLeod 的免费音乐库，提供大量免版税音乐
 * 官方网站：https://incompetech.com/music/royalty-free/
 */
/**
 * Incompetech 音乐结果
 */
export interface IncompetechMusicResult {
    id: string;
    title: string;
    url: string;
    downloadUrl: string;
    previewUrl: string;
    duration?: number;
    genre?: string;
    mood?: string;
    tempo?: string;
    description?: string;
    source: 'incompetech';
    license: 'Creative Commons BY 4.0';
    artist: 'Kevin MacLeod';
}
/**
 * 搜索选项
 */
export interface SearchOptions {
    genre?: string;
    mood?: string;
    maxResults?: number;
}
/**
 * Incompetech 音乐搜索类
 */
export declare class IncompetechMusic {
    private baseUrl;
    private musicDataUrl;
    private musicCache;
    private cacheTime;
    private cacheTTL;
    /**
     * 获取音乐数据（带缓存）
     */
    private getMusicData;
    /**
     * 从页面爬取音乐数据（备用方案）
     */
    private scrapeFromPage;
    /**
     * 获取 JSON 数据
     */
    private fetchJson;
    /**
     * 搜索音乐
     * @param query 搜索关键词
     * @param options 搜索选项
     */
    search(query: string, options?: SearchOptions): Promise<IncompetechMusicResult[]>;
    /**
     * 按流派浏览
     * @param genre 流派名称
     * @param maxResults 最大结果数
     */
    browseByGenre(genre: string, maxResults?: number): Promise<IncompetechMusicResult[]>;
    /**
     * 按情绪浏览
     * @param mood 情绪名称
     * @param maxResults 最大结果数
     */
    browseByMood(mood: string, maxResults?: number): Promise<IncompetechMusicResult[]>;
    /**
     * 获取所有可用流派
     */
    getGenres(): Promise<string[]>;
    /**
     * 获取所有可用情绪 (从 feel 字段提取)
     */
    getMoods(): Promise<string[]>;
    /**
     * 格式化音轨数据
     *
     * Incompetech API 字段映射：
     * - uuid/isrc: 唯一标识符
     * - title: 曲目名称
     * - filename: MP3 文件名
     * - length: 时长 (格式: "hh:mm:ss")
     * - genre: 流派 ID
     * - feel: 情绪/氛围
     * - bpm: 节拍
     * - description: 描述
     * - instruments: 乐器
     */
    private formatTrack;
    /**
     * 解析时长字符串 (格式: "hh:mm:ss" 或 "mm:ss")
     */
    private parseDuration;
}
//# sourceMappingURL=incompetech.d.ts.map