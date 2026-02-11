/**
 * 爬虫基类
 * 提供通用的反爬策略和工具方法
 */

import type { ScraperConfig, MediaResult, SearchOptions, IScraper } from './types';

/**
 * 常用 User-Agent 列表
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

/**
 * 爬虫基类
 */
export abstract class BaseScraper implements IScraper {
  protected config: Required<ScraperConfig>;
  protected userAgents: string[] = USER_AGENTS;

  constructor(config: ScraperConfig = {}) {
    this.config = {
      minDelay: config.minDelay ?? 2000,
      maxDelay: config.maxDelay ?? 5000,
      headless: config.headless ?? true,
      maxConcurrency: config.maxConcurrency ?? 1,
      timeoutSecs: config.timeoutSecs ?? 60,
      maxRetries: config.maxRetries ?? 3,
      proxyUrls: config.proxyUrls ?? [],
    };
  }

  /**
   * 随机延迟
   */
  protected async randomDelay(): Promise<void> {
    const delay = Math.random() * (this.config.maxDelay - this.config.minDelay) + this.config.minDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 获取随机 User-Agent
   */
  protected getRandomUA(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * 生成唯一 ID
   */
  protected generateId(source: string, identifier: string): string {
    return `${source}_${identifier}`;
  }

  /**
   * 解析时长字符串为秒数
   * @param durationStr 时长字符串，如 "1:30" 或 "01:30" 或 "1:30:00"
   */
  protected parseDuration(durationStr: string): number {
    if (!durationStr) return 0;
    
    const parts = durationStr.trim().split(':').map(p => parseInt(p, 10));
    
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      // SS
      return parts[0];
    }
    
    return 0;
  }

  /**
   * 清理标题文本
   */
  protected cleanTitle(title: string): string {
    return title
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\n\r\t]/g, '');
  }

  /**
   * 从 URL 提取文件名
   */
  protected extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || '';
      return filename.split('?')[0];
    } catch {
      return '';
    }
  }

  /**
   * 抽象方法：搜索媒体
   */
  abstract search(query: string, options?: SearchOptions): Promise<MediaResult[]>;

  /**
   * 可选方法：获取下载链接
   */
  async getDownloadUrl?(id: string): Promise<string | null>;

  /**
   * 可选方法：关闭爬虫
   */
  async close?(): Promise<void>;
}
