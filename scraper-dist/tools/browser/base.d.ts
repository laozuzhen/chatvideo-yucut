/**
 * V-Editor Scraper - Browser Tool Base
 *
 * 📦 来源：mcp-playwright/src/tools/browser/base.ts
 * 📝 用途：浏览器工具的基类，提供通用功能和错误处理
 * ✅ 已适配 v-editor-scraper 项目结构
 */
import type { Page } from 'playwright';
import { ToolHandler, ToolContext, ToolResponse } from '../common/types.js';
/**
 * Base class for all browser-based tools
 * Provides common functionality and error handling
 */
export declare abstract class BrowserToolBase implements ToolHandler {
    protected server: any;
    constructor(server: any);
    /**
     * Main execution method that all tools must implement
     */
    abstract execute(args: any, context: ToolContext): Promise<ToolResponse>;
    /**
     * Ensures a page is available and returns it
     * @param context The tool context containing browser and page
     * @returns The page or null if not available
     */
    protected ensurePage(context: ToolContext): Page | null;
    /**
     * Validates that a page is available and returns an error response if not
     * @param context The tool context
     * @returns Either null if page is available, or an error response
     */
    protected validatePageAvailable(context: ToolContext): ToolResponse | null;
    /**
     * Safely executes a browser operation with proper error handling
     * @param context The tool context
     * @param operation The async operation to perform
     * @returns The tool response
     */
    protected safeExecute(context: ToolContext, operation: (page: Page) => Promise<ToolResponse>): Promise<ToolResponse>;
}
//# sourceMappingURL=base.d.ts.map