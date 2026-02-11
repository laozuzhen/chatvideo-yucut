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

import {
  searchImages as ddgSearchImages,
  ImageSize,
  ImageType,
  ImageLayout,
  ImageColor,
  ImageLicense,
  SafeSearchType,
  type ImageSearchOptions,
  type DuckbarImageResult,
} from 'duck-duck-scrape';
import { BaseScraper } from './base';
import type { MediaResult, SearchOptions, ScraperConfig, MediaSource } from './types';

// 重新导出 duck-duck-scrape 的类型和枚举
export {
  ImageSize,
  ImageType,
  ImageLayout,
  ImageColor,
  ImageLicense,
  SafeSearchType,
  type ImageSearchOptions,
  type DuckbarImageResult,
};

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
export class DuckDuckGoImagesScraper extends BaseScraper {
  constructor(config: ScraperConfig = {}) {
    super({
      minDelay: 500,
      maxDelay: 1500,
      headless: true,
      maxConcurrency: 1,
      timeoutSecs: 30,
      maxRetries: 3,
      ...config,
    });
  }

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
  async searchImages(
    query: string,
    options: DuckDuckGoImageSearchOptions = {}
  ): Promise<DuckDuckGoImageResult[]> {
    const {
      maxResults = 50,
      safeSearch = SafeSearchType.MODERATE,
      size,
      type,
      layout,
      color,
      license,
      locale = 'en-us',
      proxy,
    } = options;

    try {
      await this.randomDelay();

      // 构建 duck-duck-scrape 的搜索选项
      const ddgOptions: ImageSearchOptions = {
        safeSearch,
        locale,
      };

      if (size) ddgOptions.size = size;
      if (type) ddgOptions.type = type;
      if (layout) ddgOptions.layout = layout;
      if (color) ddgOptions.color = color;
      if (license) ddgOptions.license = license;

      // 构建 needle 选项（支持代理）
      const needleOptions: Record<string, unknown> = {};
      
      // 优先使用传入的代理，其次使用环境变量
      const proxyUrl = proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      if (proxyUrl) {
        needleOptions.proxy = proxyUrl;
      }

      // 调用 duck-duck-scrape 的搜索函数
      const searchResults = await ddgSearchImages(query, ddgOptions, needleOptions as any);

      if (searchResults.noResults || !searchResults.results) {
        return [];
      }

      // 转换结果格式
      const results: DuckDuckGoImageResult[] = searchResults.results
        .slice(0, maxResults)
        .map((item: DuckbarImageResult) => ({
          title: item.title || '',
          image: item.image || '',
          thumbnail: item.thumbnail || '',
          url: item.url || '',
          width: item.width || 0,
          height: item.height || 0,
          source: item.source || '',
        }));

      return results;
    } catch (error) {
      console.error(`DuckDuckGo image search failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 通用搜索方法（实现 IScraper 接口）
   * 返回 MediaResult 格式
   */
  async search(query: string, options: SearchOptions = {}): Promise<MediaResult[]> {
    const maxResults = options.maxResults || 50;
    const images = await this.searchImages(query, { maxResults });

    return images.map((img, index) => ({
      id: `duckduckgo_image_${index}_${Date.now()}`,
      title: img.title,
      url: img.image,
      detailUrl: img.url,
      previewUrl: img.thumbnail,
      thumbnailUrl: img.thumbnail,
      width: img.width,
      height: img.height,
      type: 'image' as const,
      source: 'duckduckgo' as MediaSource,
      license: 'Unknown (check source)',
      author: img.source,
    }));
  }
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
export async function searchDuckDuckGoImages(
  query: string,
  maxResults = 50
): Promise<DuckDuckGoImageResult[]> {
  const scraper = new DuckDuckGoImagesScraper();
  return scraper.searchImages(query, { maxResults });
}

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
export async function searchDuckDuckGoImagesAdvanced(
  query: string,
  options: DuckDuckGoImageSearchOptions = {}
): Promise<DuckDuckGoImageResult[]> {
  const scraper = new DuckDuckGoImagesScraper();
  return scraper.searchImages(query, options);
}

export default DuckDuckGoImagesScraper;
