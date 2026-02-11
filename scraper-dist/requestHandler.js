"use strict";
/**
 * V-Editor Scraper - Request Handler
 *
 * 📦 来源：mcp-playwright/src/requestHandler.ts
 * 📝 用途：处理 MCP 请求
 * ✅ 已适配 v-editor-scraper 项目结构
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRequestHandlers = setupRequestHandlers;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const toolHandler_js_1 = require("./toolHandler.js");
const index_js_1 = require("./logging/index.js");
function setupRequestHandlers(server, tools) {
    // Initialize logger and middleware
    const logger = index_js_1.Logger.getInstance(index_js_1.Logger.createDefaultConfig());
    const loggingMiddleware = new index_js_1.RequestLoggingMiddleware(logger);
    // List resources handler
    server.setRequestHandler(types_js_1.ListResourcesRequestSchema, loggingMiddleware.wrapHandler('ListResources', async () => ({
        resources: [
            {
                uri: "console://logs",
                mimeType: "text/plain",
                name: "Browser console logs",
            },
            ...Array.from((0, toolHandler_js_1.getScreenshots)().keys()).map(name => ({
                uri: `screenshot://${name}`,
                mimeType: "image/png",
                name: `Screenshot: ${name}`,
            })),
        ],
    })));
    // Read resource handler
    server.setRequestHandler(types_js_1.ReadResourceRequestSchema, loggingMiddleware.wrapHandler('ReadResource', async (request) => {
        const uri = request.params.uri.toString();
        if (uri === "console://logs") {
            const logs = (0, toolHandler_js_1.getConsoleLogs)().join("\n");
            return {
                contents: [{
                        uri,
                        mimeType: "text/plain",
                        text: logs,
                    }],
            };
        }
        if (uri.startsWith("screenshot://")) {
            const name = uri.split("://")[1];
            const screenshot = (0, toolHandler_js_1.getScreenshots)().get(name);
            if (screenshot) {
                return {
                    contents: [{
                            uri,
                            mimeType: "image/png",
                            blob: screenshot,
                        }],
                };
            }
        }
        throw new Error(`Resource not found: ${uri}`);
    }));
    // List tools handler
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, loggingMiddleware.wrapHandler('ListTools', async () => ({
        tools: tools,
    })));
    // Call tool handler
    const wrappedToolHandler = loggingMiddleware.wrapToolHandler(toolHandler_js_1.handleToolCall);
    server.setRequestHandler(types_js_1.CallToolRequestSchema, loggingMiddleware.wrapHandler('CallTool', async (request) => wrappedToolHandler(request.params.name, request.params.arguments ?? {}, server)));
}
//# sourceMappingURL=requestHandler.js.map