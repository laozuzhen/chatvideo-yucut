/**
 * icrawler Python 桥接模块
 *
 * 通过子进程调用 Python icrawler 库实现图片搜索
 * 支持 Bing 和 Baidu 图片搜索
 */
/** 搜索引擎类型 */
export type ImageSearchEngine = 'bing' | 'baidu';
/** 单个文件信息 */
export interface ImageFile {
    path: string;
    filename: string;
    size: number;
}
/** 搜索结果 */
export interface ImageSearchResult {
    success: boolean;
    engine: ImageSearchEngine;
    keyword: string;
    requested: number;
    downloaded: number;
    files: ImageFile[];
    temp_dir: string;
    error?: string;
}
/** 搜索选项 */
export interface ImageSearchOptions {
    /** 搜索引擎 */
    engine: ImageSearchEngine;
    /** 搜索关键词 */
    keyword: string;
    /** 最大下载数量（默认 10） */
    maxNum?: number;
    /** Python 可执行文件路径（默认 'python'） */
    pythonPath?: string;
    /** 超时时间（毫秒，默认 60000） */
    timeout?: number;
}
/**
 * 使用 icrawler 搜索图片
 *
 * @param options 搜索选项
 * @returns 搜索结果
 *
 * @example
 * ```typescript
 * const result = await searchImagesWithICrawler({
 *   engine: 'bing',
 *   keyword: 'cat',
 *   maxNum: 5
 * });
 * console.log(result.files);
 * ```
 */
export declare function searchImagesWithICrawler(options: ImageSearchOptions): Promise<ImageSearchResult>;
/**
 * 搜索 Bing 图片
 *
 * @param keyword 搜索关键词
 * @param maxNum 最大下载数量
 * @returns 搜索结果
 */
export declare function searchBingImages(keyword: string, maxNum?: number): Promise<ImageSearchResult>;
/**
 * 搜索百度图片
 *
 * @param keyword 搜索关键词
 * @param maxNum 最大下载数量
 * @returns 搜索结果
 */
export declare function searchBaiduImages(keyword: string, maxNum?: number): Promise<ImageSearchResult>;
/**
 * 清理临时目录
 *
 * @param tempDir 临时目录路径
 */
export declare function cleanupTempDir(tempDir: string): Promise<void>;
/**
 * 读取下载的图片为 Buffer
 *
 * @param filePath 图片文件路径
 * @returns 图片 Buffer
 */
export declare function readImageAsBuffer(filePath: string): Buffer;
/**
 * 读取下载的图片为 Base64
 *
 * @param filePath 图片文件路径
 * @returns Base64 编码的图片
 */
export declare function readImageAsBase64(filePath: string): string;
//# sourceMappingURL=icrawler-bridge.d.ts.map