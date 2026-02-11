"use strict";
/**
 * V-Editor Scraper - Common Types
 *
 * 📦 来源：mcp-playwright/src/tools/common/types.ts
 * 📝 用途：MCP 工具的通用类型定义
 * ✅ 已适配 v-editor-scraper 项目结构
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = createErrorResponse;
exports.createSuccessResponse = createSuccessResponse;
// Helper functions for creating responses
function createErrorResponse(message) {
    return {
        content: [{
                type: "text",
                text: message
            }],
        isError: true
    };
}
function createSuccessResponse(message) {
    const messages = Array.isArray(message) ? message : [message];
    return {
        content: messages.map(msg => ({
            type: "text",
            text: msg
        })),
        isError: false
    };
}
//# sourceMappingURL=types.js.map