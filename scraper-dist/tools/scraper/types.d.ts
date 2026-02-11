/**
 * 素材爬虫共享类型定义
 */
/**
 * 媒体类型
 */
export type MediaType = 'video' | 'music' | 'sound-effect' | 'image';
/**
 * 素材来源
 */
export type MediaSource = 'mixkit' | 'pixabay' | 'coverr' | 'incompetech' | 'iconify' | 'bing' | 'baidu' | 'duckduckgo';
/**
 * 媒体搜索结果
 */
export interface MediaResult {
    /** 唯一标识符 */
    id: string;
    /** 标题 */
    title: string;
    /** 描述 */
    description?: string;
    /** 下载链接 */
    url: string;
    /** 详情页链接 */
    detailUrl?: string;
    /** 预览链接（视频预览/音乐试听） */
    previewUrl?: string;
    /** 缩略图链接 */
    thumbnailUrl?: string;
    /** 时长（秒） */
    duration?: number;
    /** 宽度（像素） */
    width?: number;
    /** 高度（像素） */
    height?: number;
    /** 媒体类型 */
    type: MediaType;
    /** 来源平台 */
    source: MediaSource;
    /** 授权信息 */
    license?: string;
    /** 标签 */
    tags?: string[];
    /** 分类 */
    category?: string;
    /** 作者 */
    author?: string;
}
/**
 * 搜索选项
 */
export interface SearchOptions {
    /** 最大结果数 */
    maxResults?: number;
    /** 页码（从 1 开始） */
    page?: number;
    /** 视频比例 */
    aspect?: '16:9' | '9:16' | '1:1' | 'any';
    /** 最小时长（秒） */
    minDuration?: number;
    /** 最大时长（秒） */
    maxDuration?: number;
    /** 分类过滤 */
    category?: string;
}
/**
 * 爬虫配置
 */
export interface ScraperConfig {
    /** 最小请求延迟（毫秒） */
    minDelay?: number;
    /** 最大请求延迟（毫秒） */
    maxDelay?: number;
    /** 是否使用无头浏览器 */
    headless?: boolean;
    /** 最大并发数 */
    maxConcurrency?: number;
    /** 请求超时（秒） */
    timeoutSecs?: number;
    /** 最大重试次数 */
    maxRetries?: number;
    /** 代理配置 */
    proxyUrls?: string[];
}
/**
 * 爬虫基类接口
 */
export interface IScraper {
    /** 搜索媒体 */
    search(query: string, options?: SearchOptions): Promise<MediaResult[]>;
    /** 获取下载链接 */
    getDownloadUrl?(id: string): Promise<string | null>;
    /** 关闭爬虫 */
    close?(): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map