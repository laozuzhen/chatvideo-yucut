/**
 * 爬虫基类
 * 提供通用的反爬策略和工具方法
 */
import type { ScraperConfig, MediaResult, SearchOptions, IScraper } from './types';
/**
 * 爬虫基类
 */
export declare abstract class BaseScraper implements IScraper {
    protected config: Required<ScraperConfig>;
    protected userAgents: string[];
    constructor(config?: ScraperConfig);
    /**
     * 随机延迟
     */
    protected randomDelay(): Promise<void>;
    /**
     * 获取随机 User-Agent
     */
    protected getRandomUA(): string;
    /**
     * 生成唯一 ID
     */
    protected generateId(source: string, identifier: string): string;
    /**
     * 解析时长字符串为秒数
     * @param durationStr 时长字符串，如 "1:30" 或 "01:30" 或 "1:30:00"
     */
    protected parseDuration(durationStr: string): number;
    /**
     * 清理标题文本
     */
    protected cleanTitle(title: string): string;
    /**
     * 从 URL 提取文件名
     */
    protected extractFilename(url: string): string;
    /**
     * 抽象方法：搜索媒体
     */
    abstract search(query: string, options?: SearchOptions): Promise<MediaResult[]>;
    /**
     * 可选方法：获取下载链接
     */
    getDownloadUrl?(id: string): Promise<string | null>;
    /**
     * 可选方法：关闭爬虫
     */
    close?(): Promise<void>;
}
//# sourceMappingURL=base.d.ts.map