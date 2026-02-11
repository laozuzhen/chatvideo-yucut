/**
 * Incompetech (Kevin MacLeod) 音乐搜索
 * 
 * 📝 用途：搜索 Incompetech 免费音乐库
 * ✅ 使用官方公开 JSON 数据，无需爬虫
 * 
 * Incompetech 是 Kevin MacLeod 的免费音乐库，提供大量免版税音乐
 * 官方网站：https://incompetech.com/music/royalty-free/
 */

import https from 'https';
import http from 'http';

/**
 * Incompetech 音乐结果
 */
export interface IncompetechMusicResult {
  id: string;
  title: string;
  url: string;
  downloadUrl: string;
  previewUrl: string;
  duration?: number;
  genre?: string;
  mood?: string;
  tempo?: string;
  description?: string;
  source: 'incompetech';
  license: 'Creative Commons BY 4.0';
  artist: 'Kevin MacLeod';
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  genre?: string;
  mood?: string;
  maxResults?: number;
}

/**
 * Incompetech 音乐搜索类
 */
export class IncompetechMusic {
  private baseUrl = 'https://incompetech.com';
  // 正确的 API 端点：pieces.json 包含所有音乐曲目
  // collections.json 只包含音乐集合/分类信息
  private musicDataUrl = 'https://incompetech.com/music/royalty-free/pieces.json';
  
  // 缓存音乐数据
  private musicCache: any[] | null = null;
  private cacheTime: number = 0;
  private cacheTTL = 3600000; // 1 小时缓存

  /**
   * 获取音乐数据（带缓存）
   */
  private async getMusicData(): Promise<any[]> {
    const now = Date.now();
    
    // 检查缓存
    if (this.musicCache && (now - this.cacheTime) < this.cacheTTL) {
      return this.musicCache;
    }

    // 获取新数据
    try {
      const data = await this.fetchJson(this.musicDataUrl);
      
      // 解析数据
      if (Array.isArray(data)) {
        this.musicCache = data;
      } else if (data.tracks) {
        this.musicCache = data.tracks;
      } else if (data.music) {
        this.musicCache = data.music;
      } else {
        // 尝试从页面爬取
        this.musicCache = await this.scrapeFromPage();
      }
      
      this.cacheTime = now;
      return this.musicCache || [];
    } catch (error) {
      console.error('Failed to fetch Incompetech data:', error);
      // 尝试从页面爬取
      return await this.scrapeFromPage();
    }
  }

  /**
   * 从页面爬取音乐数据（备用方案）
   */
  private async scrapeFromPage(): Promise<any[]> {
    // 这里可以实现页面爬取逻辑
    // 由于 Incompetech 的页面结构可能变化，这里返回空数组
    // 实际使用时可以用 Playwright 爬取
    console.warn('Incompetech JSON API not available, scraping not implemented');
    return [];
  }

  /**
   * 获取 JSON 数据
   */
  private fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.fetchJson(redirectUrl).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * 搜索音乐
   * @param query 搜索关键词
   * @param options 搜索选项
   */
  async search(query: string, options: SearchOptions = {}): Promise<IncompetechMusicResult[]> {
    const { genre, mood, maxResults = 20 } = options;
    const queryLower = query.toLowerCase();
    
    const musicData = await this.getMusicData();
    
    // 过滤和搜索
    let results = musicData.filter(track => {
      // 关键词匹配
      const titleMatch = track.title?.toLowerCase().includes(queryLower);
      const descMatch = track.description?.toLowerCase().includes(queryLower);
      const genreMatch = track.genre?.toLowerCase().includes(queryLower);
      // 注意：Incompetech API 使用 "feel" 字段表示情绪/mood
      const moodMatch = track.feel?.toLowerCase().includes(queryLower);
      const tagsMatch = track.tags?.some((t: string) => t.toLowerCase().includes(queryLower));
      const instrumentsMatch = track.instruments?.toLowerCase().includes(queryLower);
      
      const keywordMatch = titleMatch || descMatch || genreMatch || moodMatch || tagsMatch || instrumentsMatch;
      
      // 流派过滤
      if (genre && track.genre?.toLowerCase() !== genre.toLowerCase()) {
        return false;
      }
      
      // 情绪过滤 (使用 feel 字段)
      if (mood && !track.feel?.toLowerCase().includes(mood.toLowerCase())) {
        return false;
      }
      
      return keywordMatch;
    });

    // 转换为标准格式
    return results.slice(0, maxResults).map(track => this.formatTrack(track));
  }

  /**
   * 按流派浏览
   * @param genre 流派名称
   * @param maxResults 最大结果数
   */
  async browseByGenre(genre: string, maxResults = 20): Promise<IncompetechMusicResult[]> {
    const musicData = await this.getMusicData();
    
    const results = musicData.filter(track => 
      track.genre?.toLowerCase() === genre.toLowerCase()
    );

    return results.slice(0, maxResults).map(track => this.formatTrack(track));
  }

  /**
   * 按情绪浏览
   * @param mood 情绪名称
   * @param maxResults 最大结果数
   */
  async browseByMood(mood: string, maxResults = 20): Promise<IncompetechMusicResult[]> {
    const musicData = await this.getMusicData();
    
    // 使用 feel 字段，支持部分匹配（因为 feel 可能包含多个情绪）
    const results = musicData.filter(track => 
      track.feel?.toLowerCase().includes(mood.toLowerCase())
    );

    return results.slice(0, maxResults).map(track => this.formatTrack(track));
  }

  /**
   * 获取所有可用流派
   */
  async getGenres(): Promise<string[]> {
    const musicData = await this.getMusicData();
    const genres = new Set<string>();
    
    musicData.forEach(track => {
      if (track.genre) {
        genres.add(track.genre);
      }
    });

    return Array.from(genres).sort();
  }

  /**
   * 获取所有可用情绪 (从 feel 字段提取)
   */
  async getMoods(): Promise<string[]> {
    const musicData = await this.getMusicData();
    const moods = new Set<string>();
    
    musicData.forEach(track => {
      if (track.feel) {
        // feel 字段可能包含多个情绪，用逗号分隔
        const feelParts = track.feel.split(',').map((f: string) => f.trim());
        feelParts.forEach((f: string) => {
          if (f) moods.add(f);
        });
      }
    });

    return Array.from(moods).sort();
  }

  /**
   * 格式化音轨数据
   * 
   * Incompetech API 字段映射：
   * - uuid/isrc: 唯一标识符
   * - title: 曲目名称
   * - filename: MP3 文件名
   * - length: 时长 (格式: "hh:mm:ss")
   * - genre: 流派 ID
   * - feel: 情绪/氛围
   * - bpm: 节拍
   * - description: 描述
   * - instruments: 乐器
   */
  private formatTrack(track: any): IncompetechMusicResult {
    const id = track.uuid || track.isrc || track.filename || `incompetech_${Date.now()}`;
    const filename = track.filename || `${track.title}.mp3`;
    
    return {
      id,
      title: (track.title || 'Unknown Track').trim(),
      url: `${this.baseUrl}/music/royalty-free/index.html?isrc=${track.isrc || id}`,
      downloadUrl: `${this.baseUrl}/music/royalty-free/mp3-royaltyfree/${filename}`,
      previewUrl: `${this.baseUrl}/music/royalty-free/mp3-royaltyfree/${filename}`,
      duration: this.parseDuration(track.length),
      genre: track.genre,
      mood: track.feel,
      tempo: track.bpm,
      description: track.description?.trim(),
      source: 'incompetech',
      license: 'Creative Commons BY 4.0',
      artist: 'Kevin MacLeod'
    };
  }

  /**
   * 解析时长字符串 (格式: "hh:mm:ss" 或 "mm:ss")
   */
  private parseDuration(lengthStr: string | undefined): number | undefined {
    if (!lengthStr) return undefined;
    const parts = lengthStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return undefined;
  }
}
