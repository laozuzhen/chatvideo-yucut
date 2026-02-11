/**
 * Pexels Scraper
 *
 * 📝 用途：从 Pexels 搜索免费图片
 * ✅ 纯爬虫实现，无需 API Key
 *
 * 📦 来源：自定义实现，基于 Pexels 网站结构
 */
export interface PexelsImage {
    id: string;
    title: string;
    photographer: string;
    photographerUrl: string;
    thumbnailUrl: string;
    previewUrl: string;
    downloadUrl: string;
    width: number;
    height: number;
    source: 'pexels';
}
export declare class PexelsScraper {
    private browser;
    private page;
    /**
     * 初始化浏览器
     */
    private ensureBrowser;
    /**
     * 搜索图片
     */
    searchImages(query: string, maxResults?: number): Promise<PexelsImage[]>;
    /**
     * 关闭浏览器
     */
    close(): Promise<void>;
}
//# sourceMappingURL=pexels.d.ts.map