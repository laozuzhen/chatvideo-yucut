/**
 * DuckDuckGo 图片搜索爬虫
 *
 * 📦 **来源**：使用 duck-duck-scrape 库（已安装在项目中）
 * 📝 **用途**：通过 DuckDuckGo 搜索图片
 * ✅ **复用理由**：
 *    - 成熟的 npm 库，经过验证
 *    - 支持图片大小、颜色、类型等过滤
 *    - 自动处理 VQD Token 获取
 *    - 支持分页
 *
 * ⚠️ **注意事项**：
 *    - 在中国大陆需要代理才能访问 DuckDuckGo
 *    - 可通过环境变量 HTTP_PROXY/HTTPS_PROXY 设置代理
 *    - 或在 needleOptions 中配置 proxy
 *
 * @see https://www.npmjs.com/package/duck-duck-scrape
 */
import { ImageSize, ImageType, ImageLayout, ImageColor, ImageLicense, SafeSearchType, type ImageSearchOptions, type DuckbarImageResult } from 'duck-duck-scrape';
import { BaseScraper } from './base';
import type { MediaResult, SearchOptions, ScraperConfig } from './types';
export { ImageSize, ImageType, ImageLayout, ImageColor, ImageLicense, SafeSearchType, type ImageSearchOptions, type DuckbarImageResult, };
/**
 * DuckDuckGo 图片搜索结果（与 DuckbarImageResult 兼容）
 */
export interface DuckDuckGoImageResult {
    /** 图片标题 */
    title: string;
    /** 原图 URL */
    image: string;
    /** 缩略图 URL */
    thumbnail: string;
    /** 来源页面 URL */
    url: string;
    /** 图片宽度 */
    width: number;
    /** 图片高度 */
    height: number;
    /** 来源网站 */
    source: string;
}
/**
 * DuckDuckGo 图片搜索选项（扩展）
 */
export interface DuckDuckGoImageSearchOptions {
    /** 最大结果数 */
    maxResults?: number;
    /** 安全搜索级别 */
    safeSearch?: SafeSearchType;
    /** 图片大小 */
    size?: ImageSize;
    /** 图片类型 */
    type?: ImageType;
    /** 图片布局 */
    layout?: ImageLayout;
    /** 图片颜色 */
    color?: ImageColor;
    /** 图片许可证 */
    license?: ImageLicense;
    /** 区域设置 */
    locale?: string;
    /** 代理 URL（如 http://127.0.0.1:7890） */
    proxy?: string;
}
/**
 * DuckDuckGo 图片搜索爬虫类
 */
export declare class DuckDuckGoImagesScraper extends BaseScraper {
    constructor(config?: ScraperConfig);
    /**
     * 搜索 DuckDuckGo 图片
     *
     * @param query 搜索关键词
     * @param options 搜索选项
     * @returns 图片搜索结果数组
     *
     * @example
     * ```typescript
     * const scraper = new DuckDuckGoImagesScraper();
     * const images = await scraper.searchImages('sunset beach', {
     *   maxResults: 20,
     *   size: ImageSize.LARGE,
     *   license: ImageLicense.CREATIVE_COMMONS,
     * });
     * ```
     */
    searchImages(query: string, options?: DuckDuckGoImageSearchOptions): Promise<DuckDuckGoImageResult[]>;
    /**
     * 通用搜索方法（实现 IScraper 接口）
     * 返回 MediaResult 格式
     */
    search(query: string, options?: SearchOptions): Promise<MediaResult[]>;
}
/**
 * 便捷函数：搜索 DuckDuckGo 图片
 *
 * @param query 搜索关键词
 * @param maxResults 最大结果数（默认 50）
 * @returns 图片搜索结果数组
 *
 * @example
 * ```typescript
 * const images = await searchDuckDuckGoImages('sunset beach', 20);
 * console.log(images[0].image); // 原图 URL
 * console.log(images[0].thumbnail); // 缩略图 URL
 * ```
 */
export declare function searchDuckDuckGoImages(query: string, maxResults?: number): Promise<DuckDuckGoImageResult[]>;
/**
 * 便捷函数：搜索 DuckDuckGo 图片（带高级选项）
 *
 * @param query 搜索关键词
 * @param options 搜索选项
 * @returns 图片搜索结果数组
 *
 * @example
 * ```typescript
 * const images = await searchDuckDuckGoImagesAdvanced('cat', {
 *   maxResults: 10,
 *   size: ImageSize.LARGE,
 *   type: ImageType.PHOTOGRAPH,
 *   license: ImageLicense.CREATIVE_COMMONS,
 * });
 * ```
 */
export declare function searchDuckDuckGoImagesAdvanced(query: string, options?: DuckDuckGoImageSearchOptions): Promise<DuckDuckGoImageResult[]>;
export default DuckDuckGoImagesScraper;
//# sourceMappingURL=duckduckgo-images.d.ts.map