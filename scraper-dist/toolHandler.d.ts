/**
 * V-Editor Scraper - Tool Handler
 *
 * 📝 用途：处理 MCP 工具调用，分发到具体的爬虫实现
 * ✅ 纯爬虫实现，无需 API Key
 */
import { ToolResponse } from './tools/common/types.js';
export declare function getConsoleLogs(): string[];
export declare function getScreenshots(): Map<string, string>;
export declare function resetBrowserState(): void;
export declare function handleToolCall(name: string, args: Record<string, unknown>, server: unknown): Promise<ToolResponse>;
export declare function cleanup(): Promise<void>;
//# sourceMappingURL=toolHandler.d.ts.map