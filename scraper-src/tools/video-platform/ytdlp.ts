/**
 * yt-dlp 命令行封装
 * 
 * 📝 用途：封装 yt-dlp 命令行工具，支持 1000+ 视频网站
 * ✅ 无需 API Key，使用本地安装的 yt-dlp
 * 
 * 支持的平台包括：
 * - YouTube
 * - Bilibili (B站)
 * - 抖音 / TikTok
 * - Twitter / X
 * - Instagram
 * - 等 1000+ 网站
 * 
 * 前置要求：
 * - 安装 yt-dlp: pip install yt-dlp 或 brew install yt-dlp
 * - 可选安装 ffmpeg 用于格式转换
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * 搜索结果项
 */
export interface SearchResult {
  id: string;
  title: string;
  duration?: number;
  thumbnailUrl?: string;
  uploaderName?: string;
  viewCount?: number;
  platform: string;
  url: string;
}

/**
 * 视频信息
 */
export interface VideoInfo {
  id: string;
  title: string;
  description?: string;
  duration: number;
  width?: number;
  height?: number;
  fps?: number;
  thumbnailUrl?: string;
  uploaderName?: string;
  uploaderId?: string;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
  platform: string;
  originalUrl: string;
  formats: VideoFormat[];
}

/**
 * 视频格式
 */
export interface VideoFormat {
  formatId: string;
  ext: string;
  resolution?: string;
  width?: number;
  height?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  tbr?: number;
}

/**
 * 下载选项
 */
export interface DownloadOptions {
  outputDir?: string;
  format?: 'best' | '1080p' | '720p' | '480p' | string;
  audioOnly?: boolean;
  filename?: string;
  cookies?: string;
  proxy?: string;
}

/**
 * 下载结果
 */
export interface DownloadResult {
  success: boolean;
  localPath: string;
  filename: string;
  title: string;
  duration: number;
  width?: number;
  height?: number;
  filesize?: number;
  error?: string;
}

/**
 * yt-dlp 封装类
 */
export class YtDlpWrapper {
  private ytdlpPath: string = 'yt-dlp';
  private defaultOutputDir: string = './storage/videos';

  constructor(options?: { ytdlpPath?: string; outputDir?: string }) {
    if (options?.ytdlpPath) {
      this.ytdlpPath = options.ytdlpPath;
    }
    if (options?.outputDir) {
      this.defaultOutputDir = options.outputDir;
    }
  }

  /**
   * 检查 yt-dlp 是否可用
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await execAsync(`${this.ytdlpPath} --version`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取 yt-dlp 版本
   */
  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync(`${this.ytdlpPath} --version`);
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * 获取视频信息
   * @param url 视频链接
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    const args = [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      url
    ];

    try {
      const { stdout } = await execAsync(`${this.ytdlpPath} ${args.join(' ')}`);
      const data = JSON.parse(stdout);
      
      return this.parseVideoInfo(data, url);
    } catch (error) {
      throw new Error(`Failed to get video info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 解析视频信息
   */
  private parseVideoInfo(data: any, originalUrl: string): VideoInfo {
    const formats: VideoFormat[] = (data.formats || []).map((f: any) => ({
      formatId: f.format_id,
      ext: f.ext,
      resolution: f.resolution,
      width: f.width,
      height: f.height,
      fps: f.fps,
      vcodec: f.vcodec,
      acodec: f.acodec,
      filesize: f.filesize || f.filesize_approx,
      tbr: f.tbr
    }));

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      duration: data.duration,
      width: data.width,
      height: data.height,
      fps: data.fps,
      thumbnailUrl: data.thumbnail,
      uploaderName: data.uploader || data.channel,
      uploaderId: data.uploader_id || data.channel_id,
      uploadDate: data.upload_date,
      viewCount: data.view_count,
      likeCount: data.like_count,
      platform: data.extractor || this.detectPlatform(originalUrl),
      originalUrl,
      formats
    };
  }

  /**
   * 检测平台
   */
  private detectPlatform(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube';
    }
    if (urlLower.includes('bilibili.com') || urlLower.includes('b23.tv')) {
      return 'bilibili';
    }
    if (urlLower.includes('douyin.com')) {
      return 'douyin';
    }
    if (urlLower.includes('tiktok.com')) {
      return 'tiktok';
    }
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
      return 'twitter';
    }
    if (urlLower.includes('instagram.com')) {
      return 'instagram';
    }
    if (urlLower.includes('vimeo.com')) {
      return 'vimeo';
    }
    
    return 'unknown';
  }

  /**
   * 下载视频
   * @param url 视频链接
   * @param options 下载选项
   */
  async download(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
    const {
      outputDir = this.defaultOutputDir,
      format = 'best',
      audioOnly = false,
      filename,
      cookies,
      proxy
    } = options;

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 构建输出模板
    const outputTemplate = filename 
      ? path.join(outputDir, filename)
      : path.join(outputDir, '%(title)s.%(ext)s');

    // 构建命令参数
    const args: string[] = [
      '-o', `"${outputTemplate}"`,
      '--no-warnings',
      '--print-json'
    ];

    // 格式选择
    if (audioOnly) {
      args.push('-x', '--audio-format', 'mp3');
    } else {
      const formatString = this.getFormatString(format);
      args.push('-f', formatString);
    }

    // 可选参数
    if (cookies) {
      args.push('--cookies', cookies);
    }
    if (proxy) {
      args.push('--proxy', proxy);
    }

    args.push(`"${url}"`);

    try {
      const { stdout } = await execAsync(`${this.ytdlpPath} ${args.join(' ')}`);
      const data = JSON.parse(stdout.trim().split('\n').pop() || '{}');
      
      // 获取实际下载的文件路径
      const downloadedFile = data._filename || data.filename;
      const actualPath = downloadedFile || this.findDownloadedFile(outputDir, data.title);

      return {
        success: true,
        localPath: actualPath,
        filename: path.basename(actualPath),
        title: data.title,
        duration: data.duration,
        width: data.width,
        height: data.height,
        filesize: data.filesize || data.filesize_approx
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        localPath: '',
        filename: '',
        title: '',
        duration: 0,
        error: errorMessage
      };
    }
  }

  /**
   * 获取格式字符串
   */
  private getFormatString(format: string): string {
    switch (format) {
      case 'best':
        return 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
      case '1080p':
        return 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best';
      case '720p':
        return 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best';
      case '480p':
        return 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best';
      default:
        return format;
    }
  }

  /**
   * 查找下载的文件
   */
  private findDownloadedFile(dir: string, title: string): string {
    try {
      const files = fs.readdirSync(dir);
      const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '');
      
      // 查找匹配的文件
      const matchedFile = files.find(f => 
        f.includes(sanitizedTitle) || 
        f.includes(title.substring(0, 20))
      );
      
      if (matchedFile) {
        return path.join(dir, matchedFile);
      }
      
      // 返回最新的文件
      const sortedFiles = files
        .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
      
      if (sortedFiles.length > 0) {
        return path.join(dir, sortedFiles[0].name);
      }
    } catch {
      // ignore
    }
    
    return path.join(dir, `${title}.mp4`);
  }

  /**
   * 获取支持的网站列表
   */
  async getSupportedSites(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`${this.ytdlpPath} --list-extractors`);
      return stdout.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * 检查 URL 是否支持
   */
  async isUrlSupported(url: string): Promise<boolean> {
    try {
      await execAsync(`${this.ytdlpPath} --simulate --no-warnings "${url}"`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 提取音频
   * @param url 视频链接
   * @param outputDir 输出目录
   */
  async extractAudio(url: string, outputDir?: string): Promise<DownloadResult> {
    return this.download(url, {
      outputDir: outputDir || './storage/music',
      audioOnly: true
    });
  }

  /**
   * 下载缩略图
   * @param url 视频链接
   * @param outputDir 输出目录
   */
  async downloadThumbnail(url: string, outputDir?: string): Promise<string> {
    const dir = outputDir || './storage/thumbnails';
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const args = [
      '--write-thumbnail',
      '--skip-download',
      '--convert-thumbnails', 'jpg',
      '-o', `"${path.join(dir, '%(title)s.%(ext)s')}"`,
      `"${url}"`
    ];

    try {
      await execAsync(`${this.ytdlpPath} ${args.join(' ')}`);
      
      // 查找下载的缩略图
      const files = fs.readdirSync(dir);
      const thumbFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.webp'));
      
      return thumbFile ? path.join(dir, thumbFile) : '';
    } catch (error) {
      throw new Error(`Failed to download thumbnail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 搜索视频
   * @param platform 平台：youtube | bilibili
   * @param query 搜索关键词
   * @param maxResults 最大结果数（默认 10）
   * @param sortBy 排序方式：relevance（相关性）或 date（日期），仅 YouTube 支持
   * @param timeout 超时时间（毫秒，默认 60000）
   */
  async search(
    platform: 'youtube' | 'bilibili',
    query: string,
    maxResults: number = 10,
    sortBy: 'relevance' | 'date' = 'relevance',
    timeout: number = 60000
  ): Promise<SearchResult[]> {
    // B站使用直接 API 调用（yt-dlp 会触发 412 反爬虫错误）
    if (platform === 'bilibili') {
      return await this.searchBilibili(query, maxResults, timeout);
    }
    
    // YouTube 使用 yt-dlp
    return await this.searchYouTube(query, maxResults, sortBy, timeout);
  }

  /**
   * 使用 B站 API 搜索视频
   * @param query 搜索关键词
   * @param maxResults 最大结果数
   * @param timeout 超时时间
   */
  private async searchBilibili(
    query: string,
    maxResults: number,
    timeout: number
  ): Promise<SearchResult[]> {
    // B站搜索 API
    const searchUrl = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(query)}&page=1&page_size=${maxResults}`;
    
    // 生成随机 buvid3 (B站设备标识) - 必须有这个才能通过反爬虫
    const buvid3 = Array.from({ length: 35 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
    ).join('') + 'infoc';
    
    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://search.bilibili.com/',
          'Origin': 'https://search.bilibili.com',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Cookie': `buvid3=${buvid3}`,
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site'
        },
        signal: AbortSignal.timeout(timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const json = await response.json();
      
      if (json.code !== 0) {
        throw new Error(`B站 API 错误: ${json.message || json.code}`);
      }
      
      const results = json.data?.result || [];
      
      return results.map((video: any) => {
        // 解析时长字符串 (如 "24:21" 或 "1:30:00")
        let duration: number | undefined;
        if (video.duration) {
          const parts = video.duration.toString().split(':').map(Number);
          if (parts.length === 2) {
            duration = parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        }
        
        // 处理封面 URL（可能缺少协议）
        let thumbnailUrl = video.pic;
        if (thumbnailUrl && !thumbnailUrl.startsWith('http')) {
          thumbnailUrl = 'https:' + thumbnailUrl;
        }
        
        return {
          id: video.bvid || video.aid?.toString(),
          title: video.title?.replace(/<[^>]+>/g, '') || '',  // 移除 HTML 高亮标签
          duration,
          thumbnailUrl,
          uploaderName: video.author,
          viewCount: video.play,
          platform: 'bilibili',
          url: `https://www.bilibili.com/video/${video.bvid}`
        } as SearchResult;
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        throw new Error(`B站搜索超时 (${timeout}ms)。请检查网络连接。`);
      }
      
      throw new Error(`B站搜索失败: ${errorMessage}`);
    }
  }

  /**
   * 使用 yt-dlp 搜索 YouTube 视频
   * @param query 搜索关键词
   * @param maxResults 最大结果数
   * @param sortBy 排序方式
   * @param timeout 超时时间
   */
  private async searchYouTube(
    query: string,
    maxResults: number,
    sortBy: 'relevance' | 'date',
    timeout: number
  ): Promise<SearchResult[]> {
    const searchPrefix = sortBy === 'date' ? 'ytsearchdate' : 'ytsearch';
    const searchUrl = `${searchPrefix}${maxResults}:${query}`;
    
    const args = [
      '--dump-json',
      '--flat-playlist',
      '--no-download',
      '--no-warnings',
      '--socket-timeout', '30',
    ];
    
    args.push(searchUrl);

    try {
      const command = `${this.ytdlpPath} ${args.slice(0, -1).join(' ')} "${args[args.length - 1]}"`;
      
      const execPromise = execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: timeout
      });
      
      const { stdout } = await execPromise;
      
      const basicResults = stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((item): item is any => item !== null);
      
      return basicResults.map(data => {
        const videoId = data.id;
        const videoUrl = data.url || `https://www.youtube.com/watch?v=${data.id}`;
        
        const result: SearchResult = {
          id: videoId,
          title: data.title || `Video ${videoId}`,
          platform: 'youtube',
          url: videoUrl
        };
        
        if (data.duration !== undefined) result.duration = data.duration;
        if (data.thumbnail || data.thumbnails?.[0]?.url) {
          result.thumbnailUrl = data.thumbnail || data.thumbnails?.[0]?.url;
        }
        if (data.uploader || data.channel || data.uploader_id) {
          result.uploaderName = data.uploader || data.channel || data.uploader_id;
        }
        if (data.view_count !== undefined) result.viewCount = data.view_count;
        
        return result;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // 检查是否是超时错误
      if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout') || errorMessage.includes('killed')) {
        throw new Error(`YouTube 搜索超时 (${timeout}ms)。可能需要使用代理。`);
      }
      
      throw new Error(`YouTube 搜索失败: ${errorMessage}`);
    }
  }
}

/**
 * 搜索结果项
 */
export interface SearchResult {
  id: string;
  title: string;
  duration?: number;
  thumbnailUrl?: string;
  uploaderName?: string;
  viewCount?: number;
  platform: string;
  url: string;
}

