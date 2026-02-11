/**
 * V-Editor Scraper HTTP Server
 *
 * 📝 用途：为 Editor 前端提供 HTTP API，支持素材搜索和下载
 * ✅ 方案 A：本地 HTTP 服务 + 静态文件服务
 *
 * 架构：
 * - Editor 前端 (https://editor.xxx.com) 运行在远程服务器
 * - 用户通过自定义盒子（Electron）访问 Editor
 * - 盒子内运行本地 Scraper (localhost:3100)
 * - Editor 通过 fetch 调用本地 Scraper API
 */
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=server.d.ts.map