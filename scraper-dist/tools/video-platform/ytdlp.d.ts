/**
 * yt-dlp 命令行封装
 *
 * 📝 用途：封装 yt-dlp 命令行工具，支持 1000+ 视频网站
 * ✅ 无需 API Key，使用本地安装的 yt-dlp
 *
 * 支持的平台包括：
 * - YouTube
 * - Bilibili (B站)
 * - 抖音 / TikTok
 * - Twitter / X
 * - Instagram
 * - 等 1000+ 网站
 *
 * 前置要求：
 * - 安装 yt-dlp: pip install yt-dlp 或 brew install yt-dlp
 * - 可选安装 ffmpeg 用于格式转换
 */
/**
 * 搜索结果项
 */
export interface SearchResult {
    id: string;
    title: string;
    duration?: number;
    thumbnailUrl?: string;
    uploaderName?: string;
    viewCount?: number;
    platform: string;
    url: string;
}
/**
 * 视频信息
 */
export interface VideoInfo {
    id: string;
    title: string;
    description?: string;
    duration: number;
    width?: number;
    height?: number;
    fps?: number;
    thumbnailUrl?: string;
    uploaderName?: string;
    uploaderId?: string;
    uploadDate?: string;
    viewCount?: number;
    likeCount?: number;
    platform: string;
    originalUrl: string;
    formats: VideoFormat[];
}
/**
 * 视频格式
 */
export interface VideoFormat {
    formatId: string;
    ext: string;
    resolution?: string;
    width?: number;
    height?: number;
    fps?: number;
    vcodec?: string;
    acodec?: string;
    filesize?: number;
    tbr?: number;
}
/**
 * 下载选项
 */
export interface DownloadOptions {
    outputDir?: string;
    format?: 'best' | '1080p' | '720p' | '480p' | string;
    audioOnly?: boolean;
    filename?: string;
    cookies?: string;
    proxy?: string;
}
/**
 * 下载结果
 */
export interface DownloadResult {
    success: boolean;
    localPath: string;
    filename: string;
    title: string;
    duration: number;
    width?: number;
    height?: number;
    filesize?: number;
    error?: string;
}
/**
 * yt-dlp 封装类
 */
export declare class YtDlpWrapper {
    private ytdlpPath;
    private defaultOutputDir;
    constructor(options?: {
        ytdlpPath?: string;
        outputDir?: string;
    });
    /**
     * 检查 yt-dlp 是否可用
     */
    checkAvailability(): Promise<boolean>;
    /**
     * 获取 yt-dlp 版本
     */
    getVersion(): Promise<string>;
    /**
     * 获取视频信息
     * @param url 视频链接
     */
    getVideoInfo(url: string): Promise<VideoInfo>;
    /**
     * 解析视频信息
     */
    private parseVideoInfo;
    /**
     * 检测平台
     */
    private detectPlatform;
    /**
     * 下载视频
     * @param url 视频链接
     * @param options 下载选项
     */
    download(url: string, options?: DownloadOptions): Promise<DownloadResult>;
    /**
     * 获取格式字符串
     */
    private getFormatString;
    /**
     * 查找下载的文件
     */
    private findDownloadedFile;
    /**
     * 获取支持的网站列表
     */
    getSupportedSites(): Promise<string[]>;
    /**
     * 检查 URL 是否支持
     */
    isUrlSupported(url: string): Promise<boolean>;
    /**
     * 提取音频
     * @param url 视频链接
     * @param outputDir 输出目录
     */
    extractAudio(url: string, outputDir?: string): Promise<DownloadResult>;
    /**
     * 下载缩略图
     * @param url 视频链接
     * @param outputDir 输出目录
     */
    downloadThumbnail(url: string, outputDir?: string): Promise<string>;
    /**
     * 搜索视频
     * @param platform 平台：youtube | bilibili
     * @param query 搜索关键词
     * @param maxResults 最大结果数（默认 10）
     * @param sortBy 排序方式：relevance（相关性）或 date（日期），仅 YouTube 支持
     * @param timeout 超时时间（毫秒，默认 60000）
     */
    search(platform: 'youtube' | 'bilibili', query: string, maxResults?: number, sortBy?: 'relevance' | 'date', timeout?: number): Promise<SearchResult[]>;
    /**
     * 使用 B站 API 搜索视频
     * @param query 搜索关键词
     * @param maxResults 最大结果数
     * @param timeout 超时时间
     */
    private searchBilibili;
    /**
     * 使用 yt-dlp 搜索 YouTube 视频
     * @param query 搜索关键词
     * @param maxResults 最大结果数
     * @param sortBy 排序方式
     * @param timeout 超时时间
     */
    private searchYouTube;
}
/**
 * 搜索结果项
 */
export interface SearchResult {
    id: string;
    title: string;
    duration?: number;
    thumbnailUrl?: string;
    uploaderName?: string;
    viewCount?: number;
    platform: string;
    url: string;
}
//# sourceMappingURL=ytdlp.d.ts.map