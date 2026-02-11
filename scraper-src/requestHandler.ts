/**
 * V-Editor Scraper - Request Handler
 * 
 * 📦 来源：mcp-playwright/src/requestHandler.ts
 * 📝 用途：处理 MCP 请求
 * ✅ 已适配 v-editor-scraper 项目结构
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool
} from "@modelcontextprotocol/sdk/types.js";
import { handleToolCall, getConsoleLogs, getScreenshots } from "./toolHandler.js";
import { Logger, RequestLoggingMiddleware } from "./logging/index.js";

export function setupRequestHandlers(server: Server, tools: Tool[]) {
  // Initialize logger and middleware
  const logger = Logger.getInstance(Logger.createDefaultConfig());
  const loggingMiddleware = new RequestLoggingMiddleware(logger);

  // List resources handler
  server.setRequestHandler(ListResourcesRequestSchema, loggingMiddleware.wrapHandler(
    'ListResources',
    async () => ({
      resources: [
        {
          uri: "console://logs",
          mimeType: "text/plain",
          name: "Browser console logs",
        },
        ...Array.from(getScreenshots().keys()).map(name => ({
          uri: `screenshot://${name}`,
          mimeType: "image/png",
          name: `Screenshot: ${name}`,
        })),
      ],
    })
  ));

  // Read resource handler
  server.setRequestHandler(ReadResourceRequestSchema, loggingMiddleware.wrapHandler(
    'ReadResource',
    async (request) => {
      const uri = request.params.uri.toString();

      if (uri === "console://logs") {
        const logs = getConsoleLogs().join("\n");
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
        const screenshot = getScreenshots().get(name);
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
    }
  ));

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, loggingMiddleware.wrapHandler(
    'ListTools',
    async () => ({
      tools: tools,
    })
  ));

  // Call tool handler
  const wrappedToolHandler = loggingMiddleware.wrapToolHandler(handleToolCall);
  server.setRequestHandler(CallToolRequestSchema, loggingMiddleware.wrapHandler(
    'CallTool',
    async (request) => wrappedToolHandler(request.params.name, request.params.arguments ?? {}, server)
  ));
}
