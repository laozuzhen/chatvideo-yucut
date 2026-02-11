# V-Editor

**[English](README_EN.md)** | 中文

<p align="center">
  <img src="https://img.shields.io/badge/AI-Video%20Editor-FF6B6B?logo=openai" alt="AI Video Editor">
  <img src="https://img.shields.io/badge/MCP-Protocol-47848F" alt="MCP Protocol">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React 18">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
</p>

**V-Editor** 是一个 AI 驱动的在线视频剪辑器，让 AI 成为你的创意剪辑总监。

🌐 **在线体验**：[web-ai-media-editor.cn](https://web-ai-media-editor.cn) | [web-ai-media-editor.xyz](https://web-ai-media-editor.xyz)

<p align="center">
  <img src="screenshots/timeline-overview.png" alt="V-Editor 编辑器界面" width="800">
</p>

---

## ✨ 核心亮点

### 🤖 AI Agent 系统

V-Editor 内置了完整的 AI Agent 系统，不只是简单的工具调用：

- **多阶段工作流** - Agent 会自动规划、执行、验证、修复
- **智能决策** - 根据执行结果自动决定下一步行动
- **视觉验证** - 执行操作后自动截图验证效果
- **错误恢复** - 遇到问题自动尝试修复，而不是直接报错
- **上下文压缩** - 长对话自动压缩，保持响应速度
- **多模型支持** - 支持 Gemini、Claude、GPT 等主流模型

<p align="center">
  <img src="screenshots/ai-agent-panel.png" alt="AI Agent 对话面板" width="800">
</p>

### 🎬 动画 IDE（独创）

V-Editor 内置了一个专为视频动画设计的 IDE：

- **时间同步** - 代码中的 `time` 变量与时间线实时同步
- **即时预览** - 修改代码后立即在预览窗口看到效果
- **拖拽调试** - 拖动时间线，动画跟随变化
- **React 组件** - 用 React 写动画，支持 Tailwind CSS 和 Framer Motion
- **内嵌视频检测** - 自动识别 HTML 中的视频资源
- **动画节点标记** - AI 可自动生成动画关键帧标记

<p align="center">
  <img src="screenshots/html-property-panel.png" alt="HTML 动画 IDE 属性面板" width="800">
</p>

### 🎥 TransNet V2 场景检测

内置深度学习场景检测，自动识别视频中的镜头切换：

- **一键检测** - 自动分析视频，标记所有场景切换点
- **可调阈值** - 根据视频类型调整检测灵敏度
- **自动分割** - 检测后可一键将场景添加到时间线
- **短场景合并** - 智能合并过短的场景片段

### 🔍 素材爬虫（V-Editor Box）

桌面版内置素材爬虫服务，一键搜索下载：

- **免费视频** - Mixkit 高质量免版税视频
- **免费图片** - Pexels 专业摄影图片
- **免费音乐** - Incompetech (Kevin MacLeod) + Mixkit 音乐
- **视频下载** - yt-dlp 支持 YouTube、B站、抖音等 1000+ 平台

### 🔗 MCP 协议支持

可与 Kiro、Cursor、Claude Desktop 等 AI IDE 无缝集成：

- 在 AI IDE 中直接操作视频时间线
- AI 可以看到时间线状态、截取画面
- 实现代码与视频编辑的无缝协作

### 🎯 专业剪辑能力

- **多轨道时间线** - 支持无限轨道，图层叠加
- **关键帧动画** - 透明度、位置、缩放等属性动画
- **转场效果** - 淡入淡出、滑动、擦除（移植自 Remotion）
- **3D 运镜** - 震动、变焦、希区柯克、环绕
- **语义搜索** - 用自然语言搜索素材（CLIP 模型）
- **语音转字幕** - Whisper 本地转录，支持词级时间戳
- **一键口误剪辑** - 自动检测并删除口误、重复、语气词

---

## �️ 运行方式

V-Editor 可以在两种环境中运行：

| 环境 | 说明 | 素材爬虫 |
|------|------|----------|
| **网页版** | 直接在浏览器中打开 | ❌ |
| **V-Editor Box** | Electron 桌面客户端 | ✅ 内置 |

### 网页版

直接访问部署的网址，或本地启动开发服务器。所有剪辑功能都可用，但没有素材爬虫。

### V-Editor Box（本项目）

Electron 桌面客户端，内置素材爬虫服务：
- Mixkit 免费视频/音乐
- Pexels 免费图片
- yt-dlp 视频下载（支持 1000+ 平台）

---

## 🎮 使用方法

### 基本操作

1. **导入素材** - 拖拽视频/图片/音频到素材库
2. **添加到时间轴** - 将素材拖到时间轴
3. **AI 对话** - 在聊天框中用自然语言描述你想要的效果
4. **预览导出** - 实时预览并导出成品

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放/暂停 |
| `V` | 切换片段可见性 |
| `Delete` | 删除选中片段 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` | 重做 |

### AI 助手示例

在聊天框中输入：
- "添加一个 5 秒的标题，写上'欢迎观看'"
- "给视频加一个淡入淡出效果"
- "把这段视频裁剪到 10 秒"
- "添加一个从左到右的滑动转场"
- "设置成抖音竖屏格式"

---

## 🛠️ AI 工具列表

### 剪辑工具

| 工具 | 功能 |
|------|------|
| `add_element` | 添加素材/文字/HTML动画/相机运镜/转场效果，支持依赖链和TTS配音 |
| `edit_clip` | 移动/裁剪/分割/删除/复制片段 |
| `set_clip_property` | 设置属性或关键帧动画，支持批量模式和转场添加 |
| `replace_in_html_clip` | 智能修改 HTML 代码（4层匹配策略，容忍空格差异） |
| `set_project_config` | 设置分辨率/帧率/时长 |
| `batch_edit` | 批量操作/涟漪编辑 |
| `apply_timeline_edits` | 一次性应用完整时间线 JSON |

### 查询工具

| 工具 | 功能 |
|------|------|
| `inspect_timeline` | 查询时间线状态/片段详情/HTML代码（支持行号范围） |
| `inspect_html_elements` | 查询 HTML 元素坐标和代码位置 |
| `analyze_asset` | 分析素材详细信息（时长/分辨率/帧率） |
| `search_assets_semantic` | CLIP 语义搜索素材（自然语言描述） |
| `script_read` | 读取视频脚本任务列表 |

### 验证工具

| 工具 | 功能 |
|------|------|
| `capture_preview` | 截取时间线画面（单帧/多帧） |
| `capture_asset_frame` | 截取素材帧/Filmstrip缩略图条 |

### 素材分析工具

| 工具 | 功能 |
|------|------|
| `detect_video_scenes` | TransNet V2 场景检测 |
| `transcribe_audio` | Groq Whisper 语音转文字 |
| `auto_cut_speech_errors` | 一键口误剪辑（转录→分析→审批面板） |

### 搜索工具

| 工具 | 功能 |
|------|------|
| `web_search` | DuckDuckGo 网络搜索（文本/图片） |
| `search_online_images` | FreeImageDomain 在线图片搜索（免费无API Key） |

### 素材爬虫工具（仅 V-Editor Box）

| 工具 | 功能 |
|------|------|
| `search_media` | 统一媒体搜索（Mixkit视频/音乐、Pexels图片） |
| `download_stock_media` | 下载素材到本地 |
| `download_video_from_url` | yt-dlp 下载（YouTube/B站/抖音等1000+平台） |

### 任务控制工具

| 工具 | 功能 |
|------|------|
| `proceed_to_execute` | 规划完成，进入执行阶段 |
| `task_complete` | 标记任务完成 |
| `report_issue` | 报告问题，触发修复流程 |
| `ask_user` | 向用户提问并等待回复 |
| `script_write` | 写入/更新视频脚本任务列表 |

---

## 🔗 MCP 集成配置

V-Editor 通过 MCP Server 与 AI IDE 连接。连接流程：

1. 在 AI IDE 中配置 MCP Server
2. 打开 V-Editor 网页
3. 点击网页上的 **MCP 连接按钮**（自动连接或手动输入地址）

### 一键安装（npx 方式）

在 MCP 配置文件中添加：

```json
{
  "mcpServers": {
    "editor": {
      "command": "npx",
      "args": ["-y", "web-ai-editor-mcp-server@latest"],
      "env": {
        "EDITOR_WS_PORT": "9528"
      }
    }
  }
}
```

### 配置文件位置

| AI 工具 | 配置文件路径 |
|---------|-------------|
| Kiro | `~/.kiro/settings/mcp.json` |
| Cursor | `~/.cursor/mcp.json` |
| Claude Desktop (Mac) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Win) | `%APPDATA%\Claude\claude_desktop_config.json` |

### 连接步骤

1. 添加上述配置后，重启 AI 工具
2. 打开 [web-ai-media-editor.cn](https://web-ai-media-editor.cn)
3. 点击网页右上角的 **MCP** 按钮
4. 选择"自动连接"或手动输入 `ws://localhost:9528`
5. 连接成功后，AI 即可控制编辑器 ✅

---

## 🚀 部署与开发

### 网页版部署

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

### V-Editor Box 开发

```bash
cd v-editor-box

# 安装依赖
npm install

# 构建 scraper 模块
npm run build:scraper

# 启动 Electron 应用
npm start
```

### 构建桌面安装包

```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### 环境变量

```env
# AI 服务配置（可选）
VITE_OPENAI_API_KEY=your_api_key
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# Groq 语音转录（可选）
VITE_GROQ_API_KEY=your_groq_key
```

---

## 📁 项目结构

```
v-editor/
├── src/                  # V-Editor 前端源码
│   ├── agentSystem.ts    # AI Agent 系统
│   ├── mcpBridge.ts      # MCP 协议桥接
│   └── App.tsx           # 主应用
├── api/                  # Serverless API
└── v-editor-box/         # Electron 桌面客户端
    ├── main.js           # Electron 主进程 + HTTP 服务
    ├── scraper-src/      # 素材爬虫源码
    └── storage/          # 素材存储目录
```

---

## 📄 License

MIT License
