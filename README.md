<div align="center">

# PromptForge

### 将零散提示词，升级为可复用、可迭代、可追踪的专业工作流

<p align="center">
  <a href="#中文">中文</a> &nbsp;|&nbsp; <a href="#english">English</a>
</p>

</div>

---

<a id="中文"></a>

## 产品定位

PromptForge 解决的是提示词工程中的实际问题：当原始提示词用于代码生成、内容生产、数据分析、角色设定或结构化输出时，往往缺少背景上下文、执行约束、边界条件、验收标准与输出格式。PromptForge 将这些缺失项显式补齐，并把提示词重组为更稳定、更可执行的版本。

适合以下场景：

- 提示词能运行，但输出结果不稳定
- 同一任务切换模型后表现波动明显
- 团队需要沉淀、复用与回放提示词资产
- 希望基于已有版本持续迭代，而非每次从零重写

---

## 核心能力

### 1. 结构化优化

每次优化输出三层结果：

- **诊断报告**：识别原提示词的主要问题、语义缺口、约束缺失与潜在误解点
- **质量评分**：从清晰度、上下文完整度、约束完整度、输出可控性、可执行性五个维度量化评估
- **优化结果**：可直接复制使用的成品提示词

不仅呈现“改成了什么”，更说明“为什么这样改”。

### 2. 面向真实场景的 7 种模式

内置模式对应不同的系统提示词策略，覆盖常见生产场景：

| 模式 | 适用场景 |
|------|----------|
| 通用优化 | 日常任务表达优化 |
| 代码生成 | 写代码、改代码、技术方案设计 |
| 图像生成 | Midjourney、Stable Diffusion、DALL-E 等视觉模型 |
| 内容写作 | 文章、脚本、营销文案 |
| 数据分析 | 洞察、报表、商业分析、SQL 分析 |
| 角色设定 | 助手、客服、顾问、Agent 人设 |
| 结构化输出 | JSON、Markdown、表格、固定字段输出 |

### 3. 持续迭代

优化完成后，可基于当前版本继续输入迭代要求，例如：

- 更严格
- 更精简
- 加入输出格式
- 适配 Claude
- 改成英文

系统会将当前版本、诊断、评分与前置条件一并带入迭代上下文，生成新版本并保留完整版本链路。

### 4. 版本管理

每次保存的记录支持：

- 自定义命名、重命名、删除
- 重新加载、查看详情、复制内容
- 查看任务使用的前置条件
- 保留迭代版本历史与当前激活版本

PromptForge 是一个轻量级 Prompt 工作台，而非一次性输入框。

### 5. 本地持久化

数据默认保存在浏览器本地，当前版本以 IndexedDB 为主存储，保留 localStorage 降级路径：

- 刷新页面后历史记录仍然保留
- 旧版 localStorage 数据可自动迁移
- IndexedDB 不可用时自动回退工作

可作为纯前端、可私有部署的 Prompt 工具使用。

---

## 功能一览

| 能力 | 说明 |
|------|------|
| 结构化优化 | 输出诊断、评分与优化后的提示词正文 |
| 双视图预览 | 支持纯文本与 Markdown 两种结果视图 |
| 原地编辑 | 可直接编辑优化结果并回写当前版本 |
| 继续迭代 | 基于当前版本继续优化，保留版本链路 |
| 版本切换 | 可回看不同迭代版本并切换当前查看版本 |
| 前置条件 | 支持设置全局前置条件，参与优化与迭代 |
| 历史管理 | 查看、加载、重命名、删除、复制已保存记录 |
| 历史搜索 | 按名称或内容关键词搜索本地历史（已接入存储层） |
| 导入导出 | 备份 / 恢复全部本地数据为 JSON（已接入存储层） |
| 本地持久化 | IndexedDB 主存储，localStorage 降级 |
| 后端代理 | 未填 API Key 时通过服务端代理转发请求 |
| 模型兼容 | 兼容 OpenAI Chat Completions 风格接口 |

---

## 适用人群

- 高频使用 GPT、Claude、Gemini 或兼容模型的高级用户
- 需要将自然语言需求稳定转化为高质量提示词的产品经理与 AI 应用设计者
- 需要为代码生成、数据分析、内容写作、结构化输出建立模板化工作流的开发者
- 希望在本地保留提示词资产、降低对第三方 SaaS 依赖的团队

---

## 技术特点

### 纯前端、可静态部署

项目不依赖自建后端服务即可运行，部署方式灵活：

- 本地开发使用 Vite
- 生产环境可部署至 Nginx、Docker 或任意静态文件服务器
- 只要目标接口兼容 OpenAI Chat Completions 格式，即可直接接入
- 如需使用后端代理，可配合 Docker Compose 一键启动前后端

### 面向工程化使用

相比“单次输入、单次复制”的轻量工具，PromptForge 具备以下工程属性：

- 分模式系统提示词设计
- 结构化结果解析与降级策略
- 迭代版链保存
- 本地数据库持久化
- 旧存储迁移与降级容错
- 搜索、导入导出等本地数据能力已沉淀在存储层
- 后端代理模式，Key 不暴露给前端

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 Composition API |
| 构建工具 | Vite 5 |
| 数据存储 | Dexie + IndexedDB |
| 降级存储 | localStorage |
| Markdown 渲染 | marked + DOMPurify |
| 唯一 ID | uuid |
| 后端代理 | .NET 8 Web API |
| 部署形态 | 纯静态前端 + .NET 后端代理，可配合 Nginx / Docker Compose |

---

## 快速开始

```bash
git clone https://github.com/issacchow1111/PromptForge.git
cd PromptForge
npm install
npm run dev
```

默认开发地址：

```
http://localhost:5173
```

### 启动后端代理（可选）

本地开发时，在 `server-dotnet/PromptForge.Proxy/` 下创建 `appsettings.Development.json`（已加入 `.gitignore`）：

```json
{
  "Cors": { "Origin": "http://localhost:5173" },
  "Proxy": {
    "BaseUrl": "https://api.openai.com/v1",
    "ApiKey": "sk-xxxxxxxx",
    "Model": "gpt-4o-mini"
  }
}
```

然后启动后端：

```bash
cd server-dotnet/PromptForge.Proxy
ASPNETCORE_URLS=http://localhost:3000 dotnet run --no-launch-profile
```

后端代理地址：

```
http://localhost:3000
```

### Docker Compose 部署（含前后端）

Docker Compose 会同时启动前端 Nginx 和后端 .NET 代理：

```bash
# 1. 复制并编辑后端生产配置
cp server-dotnet/PromptForge.Proxy/appsettings.json server-dotnet/PromptForge.Proxy/appsettings.Production.json
# 编辑 appsettings.Production.json，填入真实的 Proxy:BaseUrl、Proxy:ApiKey、Proxy:Model

# 2. 构建前端静态产物
npm run build

# 3. 构建并启动前后端容器
docker-compose up --build -d
```

启动后：

- 前端：`http://localhost:5173/prompt/`
- 后端代理：`http://localhost:3000`

说明：

- `npm run build` 生成 `dist/` 目录，前端镜像 `Dockerfile` 会把 `dist/` 复制到 Nginx 中
- `nginx.conf` 配置前端监听 5173 端口，并把 `/api/` 转发给 `backend` 容器
- 后端镜像基于 `server-dotnet/PromptForge.Proxy/Dockerfile`
- `appsettings.Production.json` 已加入 `.gitignore`，不会被提交到 git
- .NET 配置优先级：环境变量 > `appsettings.Production.json` > `appsettings.Development.json` > `appsettings.json`

---

## 使用方式

### 1. 配置模型接口（可选）

打开页面后，在右上角菜单填写：

- 模型厂商
- 模型名称
- Base URL
- API Key

只要接口遵循 OpenAI Chat Completions 风格，即可接入。

**API Key 是可选的。** 如果不填写 API Key，请求会自动通过后端代理转发。此时需要在服务端配置上游模型接口：

- 生产环境：`server-dotnet/PromptForge.Proxy/appsettings.Production.json`（不提交到 git）
- 本地开发：`server-dotnet/PromptForge.Proxy/appsettings.Development.json`（不提交到 git）

示例：

```json
{
  "Cors": { "Origin": "http://localhost:5173" },
  "Proxy": {
    "BaseUrl": "https://api.openai.com/v1",
    "ApiKey": "sk-xxxxxxxx",
    "Model": "gpt-4o-mini"
  }
}
```

如果填写了完整的 API Key、Base URL 和模型名称，则前端会直接向该接口发送请求。

### 2. 选择优化模式

根据任务类型选择合适模式：

- 写代码 → 代码生成
- 要求 JSON 或表格 → 结构化输出
- 做分析 → 数据分析

### 3. 输入原始提示词

支持直接粘贴自然语言草稿，也支持在优化前附加全局前置条件。

### 4. 查看结果并继续迭代

优化完成后，你可以：

- 直接复制结果
- 编辑当前结果
- 继续迭代生成下一版
- 在版本记录中切换不同版本
- 保存为历史资产

---

## 典型场景

### 代码生成

将“帮我写一个登录页面”升级为：明确技术栈、文件范围、输入输出、边界条件、验收标准与禁止改动项的工程化提示词。

### 图像生成

将“画一只猫”升级为：包含主体、风格、镜头、光影、材质与负面提示词的专业图像描述。

### 数据分析

将“帮我分析销量”升级为：明确时间范围、指标定义、对比基准、图表建议与结论结构的分析任务说明。

### 内容写作

将“写一篇小红书文案”升级为：包含目标人群、语气风格、内容结构、篇幅约束与转化目标的可执行提示词。

---

## 项目结构

```text
PromptForge/
├── index.html
├── package.json
├── vite.config.js
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
├── server-dotnet/              # .NET 8 后端代理
│   └── PromptForge.Proxy/
│       ├── Program.cs
│       ├── Dockerfile
│       ├── PromptForge.Proxy.csproj
│       ├── appsettings.json
│       ├── appsettings.Development.json   # 本地开发配置（不提交）
│       ├── appsettings.Production.json    # 生产环境密钥（不提交）
│       ├── Controllers/
│       ├── Middleware/
│       ├── Models/
│       ├── PromptModes/
│       └── Services/
├── src/
│   ├── main.js                 # 应用初始化与本地数据迁移
│   ├── App.vue                 # 主工作台：输入、结果、迭代、历史
│   ├── style.css               # 全局视觉样式
│   ├── components/
│   │   ├── PromptInput.vue     # 提示词输入与模式选择
│   │   ├── ResultDisplay.vue   # 结果展示、编辑、继续迭代、版本记录
│   │   ├── FloatMenu.vue       # 模型配置与快速历史入口
│   │   ├── HistoryDrawer.vue   # 历史记录侧边抽屉
│   │   ├── HistoryModal.vue    # 历史记录详情与编辑
│   │   ├── Modal.vue           # 通用输入弹窗
│   │   ├── Toast.vue           # 状态提示
│   │   └── PreconditionModal.vue  # 全局前置条件编辑
│   └── utils/
│       ├── api.js              # 优化与迭代请求封装、结果解析、代理切换
│       ├── promptModes.js      # 7 种模式的系统提示词定义
│       ├── storage.js          # 本地数据访问层（含搜索、导入导出）
│       ├── db.js               # Dexie / IndexedDB 定义
│       ├── migrate.js          # localStorage -> IndexedDB 迁移
│       └── clipboard.js        # 剪贴板写入与降级
└── docs/
```

---

## 产品差异化

PromptForge 与“普通 Prompt 优化页面”的本质差别：

- **模式化策略**：不同场景使用不同系统提示词策略，而非统一模板
- **结构化诊断**：输出诊断与评分，而非仅返回改写文本
- **持续迭代**：基于当前版本继续优化，而非每次重来
- **版本沉淀**：保存迭代历史与激活版本，而非结果即用即丢
- **本地持久化**：IndexedDB 存储与迁移逻辑，而非刷新即丢的 demo
- **可私有部署**：纯前端架构，适合私有化与二次开发

---

## 注意事项

- 本项目本身不提供模型服务，需自行配置可用的 API 接口
- 兼容性基于 OpenAI Chat Completions 风格请求格式，不对各家私有 SDK 做直接适配
- 历史数据默认存储在浏览器本地，清除站点数据会导致本地记录丢失

---

## 开发路线

当前版本已具备完整可用的核心闭环：输入、优化、诊断、迭代、保存、回看。

已沉淀在代码中、待接入 UI 的能力：

- 历史搜索与过滤（`storage.searchHistory`）
- 数据导入 / 导出（`storage.exportData` / `storage.importData`）
- 流式优化输出（`api.optimizePromptStream`）

后续可扩展方向：

- 将上述存储层能力接入界面
- 模式模板自定义
- 团队共享与云端同步
- 更丰富的结果对比视图

---

## License

MIT License © issacchow1111

---

<a id="english"></a>

# English

## Product Positioning

PromptForge solves a practical problem in prompt engineering: raw prompts used for code generation, content production, data analysis, role-play, or structured output often lack background context, execution constraints, boundary conditions, acceptance criteria, and output formats. PromptForge makes these missing pieces explicit and rewrites the prompt into a more stable, executable version.

It is ideal when:

- Your prompt works, but the output is unstable
- The same task performs differently after switching models
- Your team needs to accumulate, reuse, and replay prompt assets
- You want to iterate from an existing version instead of rewriting from scratch every time

---

## Core Capabilities

### 1. Structured Optimization

Each optimization produces three layers of output:

- **Diagnosis Report**: Identifies the main issues, semantic gaps, missing constraints, and potential misunderstandings in the original prompt
- **Quality Score**: Quantitative evaluation across five dimensions: clarity, context completeness, constraint completeness, output controllability, and actionability
- **Optimized Result**: A production-ready prompt that can be copied and used directly

PromptForge shows not only *what was changed*, but also *why it was changed*.

### 2. Seven Modes for Real-World Scenarios

Built-in modes use different system-prompt strategies for common production scenarios:

| Mode | Use Case |
|------|----------|
| General | Everyday task expression optimization |
| Code Generation | Writing, modifying, or designing technical solutions |
| Image Generation | Visual models such as Midjourney, Stable Diffusion, DALL-E |
| Writing | Articles, scripts, marketing copy |
| Data Analysis | Insights, reports, business analysis, SQL analysis |
| Roleplay | Assistants, customer service, consultants, Agent personas |
| Structured Output | JSON, Markdown, tables, fixed-field output |

### 3. Continuous Iteration

After optimization, you can keep refining the current version with instructions such as:

- Make it stricter
- Make it shorter
- Add output format requirements
- Adapt it for Claude
- Rewrite it in English

The system carries the current version, diagnosis, score, and precondition into the iteration context, generates a new version, and preserves the full version chain.

### 4. Version Management

Every saved record supports:

- Custom naming, renaming, and deletion
- Reloading, viewing details, and copying content
- Reviewing the global precondition used for the task
- Keeping iteration history and the currently active version

PromptForge is a lightweight prompt workbench, not a one-shot input box.

### 5. Local Persistence

Data is stored locally in the browser. The current version uses IndexedDB as the primary storage with a localStorage fallback:

- History remains after refreshing the page
- Legacy localStorage data can be migrated automatically
- The app falls back gracefully when IndexedDB is unavailable

It can be used as a purely front-end, privately deployable prompt tool.

---

## Feature Overview

| Capability | Description |
|------------|-------------|
| Structured Optimization | Outputs diagnosis, score, and optimized prompt body |
| Dual-View Preview | Plain text and Markdown result views |
| In-Place Editing | Edit the optimized result and write it back to the current version |
| Continue Iterating | Optimize based on the current version while preserving the version chain |
| Version Switching | Review and switch between different iteration versions |
| Precondition | Set a global precondition that participates in optimization and iteration |
| History Management | View, load, rename, delete, and copy saved records |
| History Search | Search local history by title or content keyword (storage layer ready) |
| Import / Export | Backup and restore all local data as JSON (storage layer ready) |
| Local Persistence | IndexedDB primary storage with localStorage fallback |
| Backend Proxy | Forward requests through a server-side proxy when no API Key is provided |
| Model Compatibility | Compatible with OpenAI Chat Completions style APIs |

---

## Who It Is For

- Power users who frequently use GPT, Claude, Gemini, or compatible models
- Product managers and AI application designers who need to turn natural language requirements into high-quality prompts
- Developers who want templated workflows for code generation, data analysis, content writing, and structured output
- Teams that want to keep prompt assets local and reduce reliance on third-party SaaS tools

---

## Technical Highlights

### Pure Front-End, Statically Deployable

The project does not require a self-hosted backend service to run, offering flexible deployment options:

- Local development with Vite
- Production deployment on Nginx, Docker, or any static file server
- Direct integration with any OpenAI Chat Completions compatible endpoint
- Optional backend proxy via Docker Compose

### Built for Engineering Workflows

Compared with one-shot prompt beautifiers, PromptForge has the following engineering attributes:

- Mode-specific system prompt design
- Structured result parsing with fallback strategies
- Iteration version chain preservation
- Local database persistence
- Legacy storage migration and graceful degradation
- Search, import, and export capabilities already built into the storage layer
- Backend proxy mode that keeps the API Key away from the front end

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Front-End Framework | Vue 3 Composition API |
| Build Tool | Vite 5 |
| Data Storage | Dexie + IndexedDB |
| Fallback Storage | localStorage |
| Markdown Rendering | marked + DOMPurify |
| Unique IDs | uuid |
| Backend Proxy | .NET 8 Web API |
| Deployment | Static front end + .NET backend proxy, compatible with Nginx / Docker Compose |

---

## Quick Start

```bash
git clone https://github.com/issacchow1111/PromptForge.git
cd PromptForge
npm install
npm run dev
```

Default development URL:

```
http://localhost:5173
```

### Start the Backend Proxy (Optional)

For local development, create `appsettings.Development.json` under `server-dotnet/PromptForge.Proxy/` (already in `.gitignore`):

```json
{
  "Cors": { "Origin": "http://localhost:5173" },
  "Proxy": {
    "BaseUrl": "https://api.openai.com/v1",
    "ApiKey": "sk-xxxxxxxx",
    "Model": "gpt-4o-mini"
  }
}
```

Then start the backend:

```bash
cd server-dotnet/PromptForge.Proxy
ASPNETCORE_URLS=http://localhost:3000 dotnet run --no-launch-profile
```

Backend proxy URL:

```
http://localhost:3000
```

### Docker Compose Deployment (with Front End and Backend)

Docker Compose starts both the front-end Nginx and the back-end .NET proxy:

```bash
# 1. Copy and edit backend production configuration
cp server-dotnet/PromptForge.Proxy/appsettings.json server-dotnet/PromptForge.Proxy/appsettings.Production.json
# Edit appsettings.Production.json and fill in real Proxy:BaseUrl, Proxy:ApiKey, Proxy:Model

# 2. Build the front-end static assets
npm run build

# 3. Build and start both containers
docker-compose up --build -d
```

After startup:

- Front end: `http://localhost:5173/prompt/`
- Backend proxy: `http://localhost:3000`

Notes:

- `npm run build` generates the `dist/` directory; the front-end image `Dockerfile` copies `dist/` into Nginx
- `nginx.conf` makes the front end listen on port 5173 and forwards `/api/` to the `backend` container
- The back-end image is based on `server-dotnet/PromptForge.Proxy/Dockerfile`
- `appsettings.Production.json` is in `.gitignore` and will not be committed
- .NET configuration precedence: environment variables > `appsettings.Production.json` > `appsettings.Development.json` > `appsettings.json`

---

## How to Use

### 1. Configure the Model Interface (Optional)

Open the app and fill in the top-right menu:

- Model provider
- Model name
- Base URL
- API Key

Any interface that follows the OpenAI Chat Completions style can be connected.

**The API Key is optional.** If you do not provide an API Key, requests will be forwarded automatically through the backend proxy. In this case, configure the upstream model interface on the server:

- Production: `server-dotnet/PromptForge.Proxy/appsettings.Production.json` (not committed to git)
- Local development: `server-dotnet/PromptForge.Proxy/appsettings.Development.json` (not committed to git)

Example:

```json
{
  "Cors": { "Origin": "http://localhost:5173" },
  "Proxy": {
    "BaseUrl": "https://api.openai.com/v1",
    "ApiKey": "sk-xxxxxxxx",
    "Model": "gpt-4o-mini"
  }
}
```

If you provide a complete API Key, Base URL, and model name, the front end will send requests directly to that interface.

### 2. Select an Optimization Mode

Choose the right mode for the task:

- Writing code → Code Generation
- Requiring JSON or tables → Structured Output
- Doing analysis → Data Analysis

### 3. Enter the Original Prompt

You can paste a natural-language draft directly, and optionally attach a global precondition before optimization.

### 4. Review the Result and Keep Iterating

After optimization, you can:

- Copy the result directly
- Edit the current result
- Continue iterating to generate the next version
- Switch between versions in the version history
- Save the result as a historical asset

---

## Typical Scenarios

### Code Generation

Turn "help me write a login page" into an engineering prompt that specifies the tech stack, file scope, input/output, boundary conditions, acceptance criteria, and prohibited changes.

### Image Generation

Turn "draw a cat" into a professional image description covering subject, style, camera angle, lighting, materials, and negative prompts.

### Data Analysis

Turn "help me analyze sales" into an analysis task description that defines time range, metric definitions, comparison baselines, chart suggestions, and conclusion structure.

### Content Writing

Turn "write a Xiaohongshu post" into an executable prompt covering target audience, tone, content structure, length constraints, and conversion goals.

---

## Project Structure

```text
PromptForge/
├── index.html
├── package.json
├── vite.config.js
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
├── server-dotnet/              # .NET 8 backend proxy
│   └── PromptForge.Proxy/
│       ├── Program.cs
│       ├── Dockerfile
│       ├── PromptForge.Proxy.csproj
│       ├── appsettings.json
│       ├── appsettings.Development.json   # local dev config (not committed)
│       ├── appsettings.Production.json    # production secrets (not committed)
│       ├── Controllers/
│       ├── Middleware/
│       ├── Models/
│       ├── PromptModes/
│       └── Services/
├── src/
│   ├── main.js                 # App initialization and local data migration
│   ├── App.vue                 # Main workbench: input, result, iteration, history
│   ├── style.css               # Global visual styles
│   ├── components/
│   │   ├── PromptInput.vue     # Prompt input and mode selection
│   │   ├── ResultDisplay.vue   # Result display, editing, iteration, version records
│   │   ├── FloatMenu.vue       # Model config and quick history entry
│   │   ├── HistoryDrawer.vue   # History side drawer
│   │   ├── HistoryModal.vue    # History details and editing
│   │   ├── Modal.vue           # Generic input modal
│   │   ├── Toast.vue           # Status toast
│   │   └── PreconditionModal.vue  # Global precondition editor
│   └── utils/
│       ├── api.js              # Optimization/iteration requests, parsing, proxy switching
│       ├── promptModes.js      # System prompt definitions for the 7 modes
│       ├── storage.js          # Local data access layer (search, import/export)
│       ├── db.js               # Dexie / IndexedDB definitions
│       ├── migrate.js          # localStorage -> IndexedDB migration
│       └── clipboard.js        # Clipboard write with fallback
└── docs/
```

---

## What Makes PromptForge Different

The essential differences between PromptForge and ordinary prompt optimization tools:

- **Mode-Based Strategy**: Different scenarios use different system-prompt strategies, not a single template
- **Structured Diagnosis**: Outputs diagnosis and score, not just rewritten text
- **Continuous Iteration**: Optimizes on top of the current version instead of starting over
- **Version Preservation**: Saves iteration history and active versions instead of throwing results away
- **Local Persistence**: IndexedDB storage and migration logic instead of a refresh-and-lose demo
- **Private Deployable**: Front-end-first architecture suitable for private deployment and customization

---

## Notes

- This project does not provide model services itself; you need to configure a usable API endpoint
- Compatibility is based on the OpenAI Chat Completions style request format; proprietary SDKs from individual vendors are not directly adapted
- Historical data is stored locally in the browser by default; clearing site data will delete local records

---

## Roadmap

The current version already has a complete core loop: input, optimize, diagnose, iterate, save, and review.

Capabilities already built into the code and awaiting UI integration:

- History search and filtering (`storage.searchHistory`)
- Data import / export (`storage.exportData` / `storage.importData`)
- Streaming optimization output (`api.optimizePromptStream`)

Future expansion directions:

- Surface the above storage-layer capabilities in the UI
- Custom mode templates
- Team sharing and cloud sync
- Richer result comparison views

---

## License

MIT License © issacchow1111
