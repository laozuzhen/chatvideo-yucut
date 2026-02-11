/**
 * Pexels Scraper
 * 
 * 📝 用途：从 Pexels 搜索免费图片
 * ✅ 纯爬虫实现，无需 API Key
 * 
 * 📦 来源：自定义实现，基于 Pexels 网站结构
 */

import { chromium, Browser, Page } from 'playwright';

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

export class PexelsScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * 初始化浏览器
   */
  private async ensureBrowser(): Promise<Page> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    
    if (!this.page || this.page.isClosed()) {
      this.page = await this.browser.newPage();
      
      // 设置 User-Agent
      await this.page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      });
    }
    
    return this.page;
  }

  /**
   * 搜索图片
   */
  async searchImages(query: string, maxResults: number = 10): Promise<PexelsImage[]> {
    const page = await this.ensureBrowser();
    const results: PexelsImage[] = [];
    
    try {
      // 构建搜索 URL
      const searchUrl = `https://www.pexels.com/search/${encodeURIComponent(query)}/`;
      console.log(`[Pexels] Searching: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 等待图片加载
      await page.waitForSelector('article[data-photo-modal-medium-id], article img, .photo-item', { 
        timeout: 10000 
      }).catch(() => {
        console.log('[Pexels] No standard selectors found, trying alternative approach');
      });
      
      // 额外等待确保图片加载
      await page.waitForTimeout(2000);
      
      // 提取图片信息 - 使用多种选择器策略
      const images = await page.evaluate((maxResults) => {
        const results: any[] = [];
        
        // 策略 1: 查找 article 元素
        const articles = document.querySelectorAll('article');
        
        for (const article of articles) {
          if (results.length >= maxResults) break;
          
          // 查找图片元素
          const img = article.querySelector('img');
          if (!img) continue;
          
          // 获取图片 URL
          const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
          const srcset = img.getAttribute('srcset') || '';
          
          // 跳过占位图
          if (!src || src.includes('placeholder') || src.includes('data:image')) continue;
          
          // 解析 srcset 获取最大尺寸图片
          let downloadUrl = src;
          if (srcset) {
            const srcsetParts = srcset.split(',').map(s => s.trim());
            const lastPart = srcsetParts[srcsetParts.length - 1];
            if (lastPart) {
              downloadUrl = lastPart.split(' ')[0];
            }
          }
          
          // 获取图片 ID
          const photoId = article.getAttribute('data-photo-modal-medium-id') || 
                         article.getAttribute('data-id') ||
                         src.match(/photos\/(\d+)/)?.[1] ||
                         `pexels_${Date.now()}_${results.length}`;
          
          // 获取摄影师信息
          const photographerLink = article.querySelector('a[href*="/"]');
          const photographer = photographerLink?.textContent?.trim() || 'Unknown';
          const photographerUrl = photographerLink?.getAttribute('href') || '';
          
          // 获取图片尺寸
          const width = img.naturalWidth || parseInt(img.getAttribute('width') || '0') || 1920;
          const height = img.naturalHeight || parseInt(img.getAttribute('height') || '0') || 1080;
          
          // 获取标题
          const title = img.getAttribute('alt') || `Pexels Image ${photoId}`;
          
          results.push({
            id: String(photoId),
            title,
            photographer,
            photographerUrl: photographerUrl.startsWith('http') ? photographerUrl : `https://www.pexels.com${photographerUrl}`,
            thumbnailUrl: src,
            previewUrl: downloadUrl.replace(/\?.*$/, '') + '?auto=compress&cs=tinysrgb&w=800',
            downloadUrl: downloadUrl.replace(/\?.*$/, '') + '?auto=compress&cs=tinysrgb&dpr=2',
            width,
            height,
            source: 'pexels'
          });
        }
        
        // 策略 2: 如果 article 没找到，尝试直接查找图片
        if (results.length === 0) {
          const imgs = document.querySelectorAll('img[src*="images.pexels.com"]');
          
          for (const img of imgs) {
            if (results.length >= maxResults) break;
            
            const src = img.getAttribute('src') || '';
            if (!src || src.includes('placeholder')) continue;
            
            const photoId = src.match(/photos\/(\d+)/)?.[1] || `pexels_${Date.now()}_${results.length}`;
            const title = img.getAttribute('alt') || `Pexels Image ${photoId}`;
            
            results.push({
              id: String(photoId),
              title,
              photographer: 'Unknown',
              photographerUrl: 'https://www.pexels.com',
              thumbnailUrl: src,
              previewUrl: src.replace(/\?.*$/, '') + '?auto=compress&cs=tinysrgb&w=800',
              downloadUrl: src.replace(/\?.*$/, '') + '?auto=compress&cs=tinysrgb&dpr=2',
              width: 1920,
              height: 1080,
              source: 'pexels'
            });
          }
        }
        
        return results;
      }, maxResults);
      
      results.push(...images);
      console.log(`[Pexels] Found ${results.length} images`);
      
    } catch (error) {
      console.error('[Pexels] Search error:', error);
      throw error;
    }
    
    return results;
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
