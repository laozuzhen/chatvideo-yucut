/**
 * V-Editor Scraper - MCP 工具定义
 *
 * 📝 用途：定义所有可用的 MCP 工具
 * ✅ 纯爬虫实现，无需 API Key
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * 所有爬虫工具定义
 */
export declare const SCRAPER_TOOLS: Tool[];
/**
 * 创建工具定义列表
 * @returns MCP 工具定义数组
 */
export declare function createToolDefinitions(): Tool[];
/**
 * 根据名称获取工具定义
 * @param name 工具名称
 * @returns 工具定义或 undefined
 */
export declare function getToolByName(name: string): Tool | undefined;
/**
 * 获取所有工具名称
 * @returns 工具名称数组
 */
export declare function getToolNames(): string[];
//# sourceMappingURL=tools.d.ts.map