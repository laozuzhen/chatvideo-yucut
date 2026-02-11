"use strict";
/**
 * V-Editor Scraper - MCP 工具定义
 *
 * 📝 用途：定义所有可用的 MCP 工具
 * ✅ 纯爬虫实现，无需 API Key
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCRAPER_TOOLS = void 0;
exports.createToolDefinitions = createToolDefinitions;
exports.getToolByName = getToolByName;
exports.getToolNames = getToolNames;
/**
 * 所有爬虫工具定义
 */
exports.SCRAPER_TOOLS = [
    // ==================== 统一媒体搜索工具 ====================
    {
        name: "search_media",
        description: "统一的媒体搜索工具。根据媒体类型自动选择最佳搜索源。\n\n【搜索源说明】\n- 视频：Mixkit（免费素材）、YouTube、Bilibili\n- 音乐：Mixkit、Incompetech（Kevin MacLeod 免费音乐）\n- 图片：Bing、Baidu、DuckDuckGo（需代理）\n\n【中国大陆可用性】\n- ✅ 可用：Mixkit、Incompetech、Bing图片、Baidu图片、Bilibili\n- ⚠️ 需代理：YouTube、DuckDuckGo",
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "搜索关键词"
                },
                type: {
                    type: "string",
                    enum: ["video", "music", "image", "all"],
                    default: "all",
                    description: "媒体类型：video（视频）、music（音乐）、image（图片）、all（全部）"
                },
                sources: {
                    type: "array",
                    items: { type: "string" },
                    description: "指定搜索源（可选）。视频：mixkit, youtube, bilibili。音乐：mixkit, incompetech。图片：bing, baidu, duckduckgo"
                },
                maxResults: {
                    type: "number",
                    default: 10,
                    description: "每个源的最大返回结果数（默认 10）"
                },
                chinaMainlandOnly: {
                    type: "boolean",
                    default: true,
                    description: "是否只使用中国大陆可用的源（默认 true）"
                }
            },
            required: ["query"]
        }
    },
    // ==================== 视频信息和下载工具 ====================
    {
        name: "get_video_info",
        description: "获取视频信息（支持 YouTube、B站、抖音、TikTok 等 1000+ 网站）。返回视频标题、时长、分辨率、缩略图等信息。",
        inputSchema: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "视频链接（支持 YouTube、Bilibili、抖音、TikTok 等）"
                }
            },
            required: ["url"]
        }
    },
    {
        name: "download_video",
        description: "下载视频到本地（支持 YouTube、B站、抖音、TikTok 等 1000+ 网站）。使用 yt-dlp 实现。",
        inputSchema: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "视频链接"
                },
                format: {
                    type: "string",
                    enum: ["best", "1080p", "720p", "480p"],
                    default: "best",
                    description: "视频质量（默认 best 最佳质量）"
                },
                audioOnly: {
                    type: "boolean",
                    default: false,
                    description: "是否仅下载音频（默认 false）"
                },
                outputDir: {
                    type: "string",
                    description: "输出目录（可选，默认 ./storage/videos）"
                }
            },
            required: ["url"]
        }
    },
    // ==================== 通用下载工具 ====================
    {
        name: "download_media",
        description: "下载媒体文件到本地缓存。支持视频、图片、音乐等格式。",
        inputSchema: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "媒体文件 URL"
                },
                type: {
                    type: "string",
                    enum: ["video", "image", "music", "svg"],
                    description: "媒体类型"
                },
                filename: {
                    type: "string",
                    description: "保存文件名（可选，自动生成）"
                }
            },
            required: ["url", "type"]
        }
    },
    // ==================== 浏览器控制工具（保留兼容性） ====================
    {
        name: "browser_navigate",
        description: "导航浏览器到指定 URL",
        inputSchema: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "要导航到的 URL"
                }
            },
            required: ["url"]
        }
    },
    {
        name: "browser_screenshot",
        description: "截取当前页面的屏幕截图",
        inputSchema: {
            type: "object",
            properties: {
                fullPage: {
                    type: "boolean",
                    description: "是否截取整个页面"
                }
            }
        }
    },
    {
        name: "browser_close",
        description: "关闭浏览器和爬虫实例",
        inputSchema: {
            type: "object",
            properties: {}
        }
    }
];
/**
 * 创建工具定义列表
 * @returns MCP 工具定义数组
 */
function createToolDefinitions() {
    return exports.SCRAPER_TOOLS;
}
/**
 * 根据名称获取工具定义
 * @param name 工具名称
 * @returns 工具定义或 undefined
 */
function getToolByName(name) {
    return exports.SCRAPER_TOOLS.find(tool => tool.name === name);
}
/**
 * 获取所有工具名称
 * @returns 工具名称数组
 */
function getToolNames() {
    return exports.SCRAPER_TOOLS.map(tool => tool.name);
}
//# sourceMappingURL=tools.js.map