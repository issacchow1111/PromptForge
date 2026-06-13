<div align="center">

# PromptForge

### 将零散提示词，升级为可复用、可迭代、可追踪的专业工作流

面向 Prompt Engineering、AI 应用设计与高频生产场景的浏览器端提示词优化工具。<br />
提供结构化诊断、质量评分、版本迭代与本地持久化能力，兼容任意 OpenAI Chat Completions 风格接口。

</div>

---

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

项目不依赖自建后端服务，部署方式灵活：

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
| 部署形态 | 纯静态前端 + Node 后端代理，可配合 Nginx / Docker Compose |

---

## 快速开始

```bash
git clone https://github.com/issacchow1111/PromptForge.git
cd PromptForge
npm install
cd server && npm install && cd ..
npm run dev:full
```

默认开发地址：

```
http://localhost:5173
```

后端代理地址：

```
http://localhost:3000
```

仅启动前端：

```bash
npm run dev
```

仅启动后端：

```bash
npm run server:dev
```

生产构建：

```bash
npm run build
```

### Docker Compose 部署（含后端代理）

```bash
# 1. 复制并编辑后端配置
cp server/.env.example server/.env
# 编辑 server/.env，填入真实的 PROXY_BASE_URL、PROXY_API_KEY、PROXY_MODEL

# 2. 构建并启动
npm run build
docker-compose up --build -d
```

访问 `http://localhost:5173/prompt/`。

---

## 使用方式

### 1. 配置模型接口（可选）

打开页面后，在右上角菜单填写：

- 模型厂商
- 模型名称
- Base URL
- API Key

只要接口遵循 OpenAI Chat Completions 风格，即可接入。

**API Key 是可选的。** 如果不填写 API Key，请求会自动通过后端代理转发。此时需要在 `server/.env` 中配置服务端的上游模型接口：

```env
PORT=3000
PROXY_BASE_URL=https://api.openai.com/v1
PROXY_API_KEY=sk-xxxxxxxx
PROXY_MODEL=gpt-4o-mini
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
├── server/                     # Node 后端代理
│   ├── package.json
│   ├── index.js
│   ├── .env.example
│   ├── routes/
│   │   └── proxy.js
│   └── middleware/
│       ├── rateLimiter.js
│       ├── requestValidator.js
│       └── errorHandler.js
├── src/
│   ├── main.js                 # 应用初始化与本地数据迁移
│   ├── App.vue                 # 主工作台：输入、结果、迭代、历史
│   ├── style.css               # 全局视觉样式
│   ├── components/
│   │   ├── PromptInput.vue     # 提示词输入与模式选择
│   │   ├── ResultDisplay.vue   # 结果展示、编辑、继续迭代、版本记录
│   │   ├── FloatMenu.vue       # API 配置与快速历史入口
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

## English Summary

PromptForge is a browser-based prompt optimization workbench built with Vue 3.

It helps users turn rough prompts into structured, model-ready instructions through:

- mode-specific optimization strategies
- structured diagnosis and scoring
- iterative refinement on top of the current version
- version history and local persistence
- IndexedDB-based storage with localStorage fallback
- history search and data import/export (storage layer ready)
- compatibility with OpenAI Chat Completions style APIs

It is designed for developers, AI product builders, content creators, and power users who want a private, deployable, front-end-first prompt workflow instead of a one-shot prompt beautifier.
