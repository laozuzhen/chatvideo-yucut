#!/usr/bin/env node
/**
 * V-Editor Scraper - MCP Server 入口
 *
 * 📝 用途：素材爬虫 MCP 服务器
 * ✅ 纯爬虫实现，无需 API Key
 *
 * 支持的素材源：
 * - Mixkit（视频、音乐、音效）
 * - Incompetech（Kevin MacLeod 免费音乐）
 * - yt-dlp（YouTube、B站、抖音等 1000+ 网站）
 */
export * from './tools/scraper';
export { MixkitScraper } from './tools/scraper/mixkit';
export { IncompetechMusic } from './tools/scraper/incompetech';
export { YtDlpWrapper } from './tools/video-platform/ytdlp';
//# sourceMappingURL=index.d.ts.map