#!/usr/bin/env node
"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YtDlpWrapper = exports.IncompetechMusic = exports.MixkitScraper = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const requestHandler_js_1 = require("./requestHandler.js");
const tools_js_1 = require("./tools.js");
const index_js_2 = require("./logging/index.js");
const toolHandler_js_1 = require("./toolHandler.js");
// 服务器信息
const SERVER_NAME = "v-editor-scraper";
const SERVER_VERSION = "1.0.0";
async function main() {
    // 初始化日志
    const logger = index_js_2.Logger.getInstance(index_js_2.Logger.createDefaultConfig());
    const loggingMiddleware = new index_js_2.RequestLoggingMiddleware(logger);
    // 创建 MCP Server
    const server = new index_js_1.Server({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    }, {
        capabilities: {
            resources: {},
            tools: {},
        },
    });
    // 获取工具定义
    const tools = (0, tools_js_1.createToolDefinitions)();
    // 设置请求处理器
    (0, requestHandler_js_1.setupRequestHandlers)(server, tools);
    // 记录服务器启动
    loggingMiddleware.logServerStartup({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        toolCount: tools.length,
    });
    // 创建 stdio 传输
    const transport = new stdio_js_1.StdioServerTransport();
    // 处理进程退出
    process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down...');
        await (0, toolHandler_js_1.cleanup)();
        loggingMiddleware.logServerShutdown();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down...');
        await (0, toolHandler_js_1.cleanup)();
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
__exportStar(require("./tools/scraper"), exports);
var mixkit_1 = require("./tools/scraper/mixkit");
Object.defineProperty(exports, "MixkitScraper", { enumerable: true, get: function () { return mixkit_1.MixkitScraper; } });
var incompetech_1 = require("./tools/scraper/incompetech");
Object.defineProperty(exports, "IncompetechMusic", { enumerable: true, get: function () { return incompetech_1.IncompetechMusic; } });
var ytdlp_1 = require("./tools/video-platform/ytdlp");
Object.defineProperty(exports, "YtDlpWrapper", { enumerable: true, get: function () { return ytdlp_1.YtDlpWrapper; } });
//# sourceMappingURL=index.js.map