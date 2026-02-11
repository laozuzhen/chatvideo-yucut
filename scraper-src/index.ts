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

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupRequestHandlers } from "./requestHandler.js";
import { createToolDefinitions } from "./tools.js";
import { Logger, RequestLoggingMiddleware } from "./logging/index.js";
import { cleanup } from "./toolHandler.js";

// 服务器信息
const SERVER_NAME = "v-editor-scraper";
const SERVER_VERSION = "1.0.0";

async function main() {
  // 初始化日志
  const logger = Logger.getInstance(Logger.createDefaultConfig());
  const loggingMiddleware = new RequestLoggingMiddleware(logger);

  // 创建 MCP Server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // 获取工具定义
  const tools = createToolDefinitions();

  // 设置请求处理器
  setupRequestHandlers(server, tools);

  // 记录服务器启动
  loggingMiddleware.logServerStartup({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    toolCount: tools.length,
  });

  // 创建 stdio 传输
  const transport = new StdioServerTransport();

  // 处理进程退出
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    await cleanup();
    loggingMiddleware.logServerShutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...');
    await cleanup();
    loggingMiddleware.logServerShutdown();
    process.exit(0);
  });

  // 连接并运行
  await server.connect(transport);
  
  logger.info(`${SERVER_NAME} v${SERVER_VERSION} started successfully`);
  logger.info(`Available tools: ${tools.map(t => t.name).join(', ')}`);
}

// 运行主函数
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// 导出爬虫模块（供直接导入使用）
export * from './tools/scraper';
export { MixkitScraper } from './tools/scraper/mixkit';
export { IncompetechMusic } from './tools/scraper/incompetech';
export { YtDlpWrapper } from './tools/video-platform/ytdlp';
