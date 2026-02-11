/**
 * V-Editor Scraper - Common Types
 *
 * 📦 来源：mcp-playwright/src/tools/common/types.ts
 * 📝 用途：MCP 工具的通用类型定义
 * ✅ 已适配 v-editor-scraper 项目结构
 */
import type { CallToolResult, TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';
import type { Page, Browser, APIRequestContext } from 'playwright';
export interface ToolContext {
    page?: Page;
    browser?: Browser;
    apiContext?: APIRequestContext;
    server?: any;
}
export interface ToolResponse extends CallToolResult {
    content: (TextContent | ImageContent)[];
    isError: boolean;
}
export interface ToolHandler {
    execute(args: any, context: ToolContext): Promise<ToolResponse>;
}
export declare function createErrorResponse(message: string): ToolResponse;
export declare function createSuccessResponse(message: string | string[]): ToolResponse;
export interface ScraperResult {
    url: string;
    title?: string;
    thumbnailUrl?: string;
    downloadUrl?: string;
    duration?: number;
    width?: number;
    height?: number;
    format?: string;
    source: string;
    metadata?: Record<string, any>;
}
export interface SearchOptions {
    query: string;
    limit?: number;
    page?: number;
    filters?: Record<string, any>;
}
//# sourceMappingURL=types.d.ts.map