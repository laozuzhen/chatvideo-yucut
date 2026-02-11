"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuckDuckGoImagesScraper = exports.SafeSearchType = exports.ImageLicense = exports.ImageColor = exports.ImageLayout = exports.ImageType = exports.ImageSize = void 0;
exports.searchDuckDuckGoImages = searchDuckDuckGoImages;
exports.searchDuckDuckGoImagesAdvanced = searchDuckDuckGoImagesAdvanced;
const duck_duck_scrape_1 = require("duck-duck-scrape");
Object.defineProperty(exports, "ImageSize", { enumerable: true, get: function () { return duck_duck_scrape_1.ImageSize; } });
Object.defineProperty(exports, "ImageType", { enumerable: true, get: function () { return duck_duck_scrape_1.ImageType; } });
Object.defineProperty(exports, "ImageLayout", { enumerable: true, get: function () { return duck_duck_scrape_1.ImageLayout; } });
Object.defineProperty(exports, "ImageColor", { enumerable: true, get: function () { return duck_duck_scrape_1.ImageColor; } });
Object.defineProperty(exports, "ImageLicense", { enumerable: true, get: function () { return duck_duck_scrape_1.ImageLicense; } });
Object.defineProperty(exports, "SafeSearchType", { enumerable: true, get: function () { return duck_duck_scrape_1.SafeSearchType; } });
const base_1 = require("./base");
/**
 * DuckDuckGo 图片搜索爬虫类
 */
class DuckDuckGoImagesScraper extends base_1.BaseScraper {
    constructor(config = {}) {
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
    async searchImages(query, options = {}) {
        const { maxResults = 50, safeSearch = duck_duck_scrape_1.SafeSearchType.MODERATE, size, type, layout, color, license, locale = 'en-us', proxy, } = options;
        try {
            await this.randomDelay();
            // 构建 duck-duck-scrape 的搜索选项
            const ddgOptions = {
                safeSearch,
                locale,
            };
            if (size)
                ddgOptions.size = size;
            if (type)
                ddgOptions.type = type;
            if (layout)
                ddgOptions.layout = layout;
            if (color)
                ddgOptions.color = color;
            if (license)
                ddgOptions.license = license;
            // 构建 needle 选项（支持代理）
            const needleOptions = {};
            // 优先使用传入的代理，其次使用环境变量
            const proxyUrl = proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
            if (proxyUrl) {
                needleOptions.proxy = proxyUrl;
            }
            // 调用 duck-duck-scrape 的搜索函数
            const searchResults = await (0, duck_duck_scrape_1.searchImages)(query, ddgOptions, needleOptions);
            if (searchResults.noResults || !searchResults.results) {
                return [];
            }
            // 转换结果格式
            const results = searchResults.results
                .slice(0, maxResults)
                .map((item) => ({
                title: item.title || '',
                image: item.image || '',
                thumbnail: item.thumbnail || '',
                url: item.url || '',
                width: item.width || 0,
                height: item.height || 0,
                source: item.source || '',
            }));
            return results;
        }
        catch (error) {
            console.error(`DuckDuckGo image search failed: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * 通用搜索方法（实现 IScraper 接口）
     * 返回 MediaResult 格式
     */
    async search(query, options = {}) {
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
            type: 'image',
            source: 'duckduckgo',
            license: 'Unknown (check source)',
            author: img.source,
        }));
    }
}
exports.DuckDuckGoImagesScraper = DuckDuckGoImagesScraper;
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
async function searchDuckDuckGoImages(query, maxResults = 50) {
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
async function searchDuckDuckGoImagesAdvanced(query, options = {}) {
    const scraper = new DuckDuckGoImagesScraper();
    return scraper.searchImages(query, options);
}
exports.default = DuckDuckGoImagesScraper;
//# sourceMappingURL=duckduckgo-images.js.map