# V-Editor 项目架构分析报告

## 1. 项目概述

### 1.1 v-editor-box 的实际用途

**v-editor-box 是一个 Electron 桌面客户端应用**，它的核心功能是：

1. **桌面端容器**：使用 Electron 28 封装 V-Editor 前端，提供原生桌面体验
2. **内置素材爬虫服务**：在本地运行 HTTP 服务器（端口 3100），提供素材搜索和下载功能
3. **一体化部署**：将前端 + 后端服务打包成单一桌面应用，无需用户配置服务器

**技术栈**：
- Electron 28（桌面框架）
- Express.js（内置 HTTP 服务器）
- Playwright（浏览器自动化，用于爬虫）
- Crawlee（爬虫框架）
- yt-dlp（视频下载）

### 1.2 主项目（根目录）是什么？

**主项目是 V-Editor 的前端应用**，一个基于 React + Vite 的 AI 视频剪辑器。

**核心特性**：
- 纯前端架构，运行在浏览器中
- AI 驱动的视频剪辑（支持 Function Calling）
- WebCodecs 视频处理
- 本地 AI 模型（CLIP、Whisper、TransNet V2）
- MCP 协议支持

**V-Editor 前端位置**：`src/` 目录
- 主入口：`src/main.tsx`
- 核心组件：`src/App.tsx`（约 5000+ 行，包含完整的编辑器逻辑）
- Agent 系统：`src/agentSystem.ts`（工具定义和 AI 交互）
- MCP 桥接：`src/mcpBridge.ts`（WebSocket 通信）

---

## 2. v-editor-box 和主项目的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        v-editor-box (Electron)                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    main.js (主进程)                          ││
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐  ││
│  │  │  BrowserWindow  │  │  Express HTTP Server (3100)     │  ││
│  │  │  加载前端 URL    │  │  - /api/search/video           │  ││
│  │  │  (localhost:8080)│  │  - /api/search/music           │  ││
│  │  └────────┬────────┘  │  - /api/download                │  ││
│  │           │           │  - /api/ytdlp                   │  ││
│  │           │           │  - /storage/* (静态文件)         │  ││
│  │           │           └─────────────────────────────────┘  ││
│  └───────────┼────────────────────────────────────────────────┘│
│              │                                                  │
│              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    渲染进程 (Chromium)                       ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │              V-Editor 前端 (React)                       │││
│  │  │  - 时间线编辑器                                          │││
│  │  │  - AI 对话框                                             │││
│  │  │  - 素材库管理                                            │││
│  │  │  - MCP Bridge (WebSocket)                               │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP 请求
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    主项目 (根目录)                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  src/                                                        ││
│  │  ├── App.tsx          # 主编辑器组件                         ││
│  │  ├── agentSystem.ts   # AI Agent 系统 + 工具定义             ││
│  │  ├── mcpBridge.ts     # MCP WebSocket 桥接                   ││
│  │  ├── htmlTemplates.ts # HTML 片段模板系统                    ││
│  │  └── utils/           # 工具函数                             ││
│  │      └── videoFrameCapture.ts  # 视频帧提取                  ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  api/                 # Vercel Serverless Functions          ││
│  │  ├── chat-agent.js    # AI 对话 API                          ││
│  │  ├── chat-stream.js   # 流式响应                             ││
│  │  └── tts-edge.js      # Edge TTS                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 关系说明

| 组件 | 角色 | 通信方式 |
|------|------|----------|
| **主项目 (src/)** | V-Editor 前端 | 被 Electron 加载 |
| **v-editor-box** | 桌面容器 + 本地服务 | HTTP API (3100) |
| **api/** | 云端 API (Vercel) | HTTPS |

**数据流**：
1. 用户在 V-Editor 前端操作
2. 前端通过 HTTP 调用 v-editor-box 的本地服务（素材搜索/下载）
3. 前端通过 HTTPS 调用云端 API（AI 对话、TTS）
4. 前端通过 WebSocket 与 MCP Server 通信（Kiro/Cursor 集成）

---

## 3. MCP 协议实现

### 3.1 MCP 桥接文件位置

**核心文件**：`src/mcpBridge.ts`

### 3.2 MCP 协议实现方式

V-Editor 使用 **WebSocket** 实现 MCP 协议：

```typescript
// src/mcpBridge.ts

// 默认 WebSocket URL
const DEFAULT_WS_URL = 'ws://localhost:9528';

// 连接到 MCP Server
export function connectMCP() {
  ws = new WebSocket(wsUrl);
  
  ws.onmessage = async (event) => {
    const msg = JSON.parse(event.data);
    
    // 返回工具定义列表
    if (msg.type === 'get_tool_definitions') {
      ws.send(JSON.stringify({
        type: 'tool_definitions',
        id: msg.id,
        definitions: AGENT_TOOL_DEFINITIONS
      }));
    }
    
    // 处理工具调用
    if (msg.type === 'tool_call') {
      const handler = toolHandlers[msg.tool];
      const result = await handler(msg.args);
      sendResult(msg.id, result);
    }
  };
}
```

### 3.3 MCP 消息类型

| 消息类型 | 方向 | 说明 |
|----------|------|------|
| `get_tool_definitions` | Server → Editor | 请求工具定义列表 |
| `tool_definitions` | Editor → Server | 返回工具定义 |
| `tool_call` | Server → Editor | 调用工具 |
| `tool_result` | Editor → Server | 返回工具执行结果 |
| `state_changed` | Editor → Server | 通知状态变化 |

### 3.4 MCP Server 配置

**独立 MCP Server**：`editor-mcp-server/` 目录

```javascript
// editor-mcp-server/index.js
// 作为独立进程运行，通过 WebSocket 与 V-Editor 前端通信
```

**Kiro 配置示例**：
```json
// ~/.kiro/settings/mcp.json
{
  "mcpServers": {
    "v-editor": {
      "url": "ws://localhost:8080/mcp"
    }
  }
}
```

---

## 4. Editor 核心功能

### 4.1 工具定义位置

**文件**：`src/agentSystem.ts`

### 4.2 核心工具分类

#### 时间线操作工具

| 工具名 | 功能 |
|--------|------|
| `edit_clip` | 移动、裁剪、分割、删除、复制片段 |
| `add_element` | 添加素材、文字、HTML、相机、转场 |
| `set_clip_property` | 设置属性或关键帧动画 |
| `batch_edit` | 批量操作、涟漪编辑 |
| `apply_timeline_edits` | 一次性应用时间线 JSON |

#### 查询验证工具

| 工具名 | 功能 |
|--------|------|
| `inspect_timeline` | 查询时间线状态、片段详情 |
| `capture_preview` | 截取时间线画面 |
| `capture_asset_frame` | 截取素材帧/Filmstrip |
| `inspect_html_elements` | 查询 HTML 片段内部元素 |
| `replace_in_html_clip` | 智能替换 HTML 代码 |

#### 素材分析工具

| 工具名 | 功能 |
|--------|------|
| `detect_video_scenes` | TransNet V2 场景检测 |
| `analyze_asset` | 分析素材详情 |
| `transcribe_audio` | Groq Whisper 语音转文字 |
| `search_assets_semantic` | CLIP 语义搜索 |
| `auto_cut_speech_errors` | 一键口误剪辑 |

#### 素材爬虫工具（v-editor-box 后端）

| 工具名 | 功能 |
|--------|------|
| `search_media` | 统一媒体搜索（视频/音乐/图片） |
| `download_stock_media` | 下载素材到本地 |
| `download_video_from_url` | yt-dlp 视频下载 |

### 4.3 工具定义示例

```typescript
// src/agentSystem.ts

export const AGENT_TOOL_DEFINITIONS = [
  {
    name: 'add_element',
    description: '向时间线添加各种类型的元素...',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: '元素类型: clip | text | html | script | camera | composition | transition' },
        timeline_start: { type: 'number', description: '开始时间(秒)' },
        duration: { type: 'number', description: '持续时长(秒)' },
        channel: { type: 'integer', description: '轨道号' },
        // ... 更多参数
      },
      required: ['type', 'timeline_start', 'duration']
    }
  },
  // ... 更多工具定义
];
```

---

## 5. 素材爬虫服务 API 端点

### 5.1 服务地址

**本地服务**：`http://localhost:3100`

### 5.2 API 端点列表

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/status` | GET | 服务状态检查 |
| `/api/search/video` | POST | 搜索视频（Mixkit） |
| `/api/search/image` | POST | 搜索图片（Pexels） |
| `/api/search/music` | POST | 搜索音乐（Incompetech/Mixkit） |
| `/api/search/media` | POST | 统一媒体搜索 |
| `/api/download` | POST | 下载素材到本地 |
| `/api/ytdlp` | POST | yt-dlp 视频下载 |
| `/api/ytdlp/info` | POST | 获取视频信息 |
| `/api/files/:type` | GET | 列出已下载文件 |
| `/api/files/:type/:filename` | DELETE | 删除已下载文件 |
| `/storage/*` | GET | 静态文件服务 |

### 5.3 API 请求示例

```javascript
// 统一媒体搜索
fetch('http://localhost:3100/api/search/media', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '城市夜景',
    type: 'all',  // all | video | image | music
    maxResults: 10
  })
})

// yt-dlp 下载
fetch('http://localhost:3100/api/ytdlp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.bilibili.com/video/BVxxx',
    format: 'best',
    audioOnly: false
  })
})
```

### 5.4 素材源说明

| 类型 | 来源 | 说明 |
|------|------|------|
| 视频 | Mixkit | 免费素材，无需 API Key |
| 图片 | Pexels | 免费素材，无需 API Key |
| 音乐 | Incompetech | Kevin MacLeod 免费音乐 |
| 音乐 | Mixkit | 免费音乐 |
| 视频下载 | yt-dlp | 支持 1000+ 平台 |

---

## 6. 项目目录结构

```
v-editor/                          # 主项目根目录
├── src/                           # V-Editor 前端源码
│   ├── App.tsx                    # 主编辑器组件 (5000+ 行)
│   ├── agentSystem.ts             # AI Agent 系统 + 工具定义
│   ├── mcpBridge.ts               # MCP WebSocket 桥接
│   ├── htmlTemplates.ts           # HTML 片段模板系统
│   ├── utils/                     # 工具函数
│   │   └── videoFrameCapture.ts   # 视频帧提取
│   └── components/                # React 组件
│
├── api/                           # Vercel Serverless Functions
│   ├── chat-agent.js              # AI 对话 API
│   ├── chat-stream.js             # 流式响应
│   └── tts-edge.js                # Edge TTS
│
├── v-editor-box/                  # Electron 桌面客户端
│   ├── main.js                    # Electron 主进程 + HTTP 服务器
│   ├── preload.js                 # 预加载脚本
│   ├── package.json               # 项目配置
│   ├── scraper-src/               # 爬虫源码 (TypeScript)
│   │   ├── tools/
│   │   │   ├── scraper/           # 素材网站爬虫
│   │   │   │   ├── mixkit.ts      # Mixkit 视频/音乐
│   │   │   │   ├── pexels.ts      # Pexels 图片
│   │   │   │   └── incompetech.ts # Incompetech 音乐
│   │   │   └── video-platform/
│   │   │       └── ytdlp.ts       # yt-dlp 封装
│   │   └── toolHandler.ts         # 工具调用处理器
│   ├── scraper-dist/              # 爬虫编译输出
│   └── storage/                   # 素材存储
│       ├── videos/
│       ├── music/
│       ├── images/
│       └── svg/
│
├── editor-mcp-server/             # 独立 MCP Server
│   ├── index.js                   # MCP Server 入口
│   └── README.md                  # 配置说明
│
└── public/                        # 静态资源
    └── models/                    # AI 模型文件
```

---

## 7. 总结

### 7.1 架构特点

1. **前后端分离**：前端 (React) 和后端 (Electron/Vercel) 完全分离
2. **多部署模式**：
   - 纯前端模式：部署到 Vercel，使用云端 API
   - 桌面模式：使用 v-editor-box，内置本地服务
3. **MCP 协议支持**：可与 Kiro、Cursor、Claude Desktop 集成
4. **本地 AI 模型**：CLIP、Whisper、TransNet V2 在浏览器中运行

### 7.2 关键文件

| 文件 | 作用 |
|------|------|
| `src/App.tsx` | 主编辑器组件，包含所有 UI 和逻辑 |
| `src/agentSystem.ts` | AI 工具定义和 Agent 系统 |
| `src/mcpBridge.ts` | MCP WebSocket 通信 |
| `v-editor-box/main.js` | Electron 主进程 + HTTP 服务器 |
| `v-editor-box/scraper-src/toolHandler.ts` | 爬虫工具处理器 |

### 7.3 通信协议

| 协议 | 用途 | 端口 |
|------|------|------|
| HTTP | 素材爬虫服务 | 3100 |
| WebSocket | MCP 协议 | 9528 |
| HTTPS | 云端 API | 443 |
