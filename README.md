<div align="center">

# PromptForge

### 把随手一写的提示词，升级成可复用、可迭代、可追踪的专业工作流

一款面向 Prompt Engineering、AI 应用设计与高频生产场景的浏览器端提示词优化工具。<br />
支持结构化诊断、质量评分、继续迭代、版本留存与本地持久化，兼容任意 OpenAI Chat Completions 风格接口。

</div>

---

## 项目定位

PromptForge 不是一个“把句子润色一下”的小工具。

它解决的是更实际的问题：当你准备把提示词用于代码生成、内容生产、数据分析、角色设定或结构化输出时，原始输入通常缺少上下文、约束、边界、验收标准和输出格式。PromptForge 会把这些缺口显式化，并将提示词重组为更稳定、更可执行的版本。

如果你经常遇到这些问题，这个项目就是为你准备的：

- 提示词能跑，但结果不稳定
- 同一任务换个模型就表现波动
- 团队里提示词无法沉淀、复用和回放
- 需要在“先优化一版”之后继续迭代，而不是每次从头重写

---

## 你会得到什么

### 1. 结构化优化，而不是表面润色

每次优化都会尽量把原始需求拆成三层结果：

- 诊断报告：原提示词的主要问题、语义缺口、约束缺失、潜在误解点
- 质量评分：按清晰度、上下文完整度、约束完整度、输出可控性、可执行性打分
- 优化结果：可直接复制使用的成品提示词

这意味着它不仅告诉你“改成了什么”，还告诉你“为什么要这样改”。

### 2. 面向真实场景的 7 种优化模式

内置模式不是简单换标题，而是对应不同的系统提示词策略：

- 通用优化
- 代码生成
- 图像生成
- 内容写作
- 数据分析
- 角色设定
- 结构化输出

每种模式都会强调不同的优化重点，例如技术约束、画面描述、分析口径、角色边界或固定字段输出。

### 3. 继续迭代，而不是推倒重来

优化完成后，可以基于当前版本继续输入迭代要求，例如：

- 更严格
- 更精简
- 加入输出格式
- 适配 Claude
- 改成英文

系统会把当前版本、诊断、评分和前置条件一并带入迭代上下文，生成下一版，并保留版本链路。

### 4. 版本记录可追踪

每次保存的记录都支持：

- 自定义命名
- 重新加载
- 查看详情
- 复制内容
- 重命名
- 删除
- 查看该次任务使用的前置条件
- 保留迭代版本历史与当前激活版本

这使 PromptForge 更像一个轻量级 Prompt 工作台，而不是一次性输入框。

### 5. 浏览器端持久化，不依赖后端账号体系

数据默认保存在本地浏览器中，当前版本使用 IndexedDB 作为主存储，并保留 localStorage 降级路径：

- 刷新页面后历史记录仍然保留
- 旧版 localStorage 数据可自动迁移
- 在 IndexedDB 不可用时仍能回退工作

这意味着你可以把它当作一个纯前端、可私有部署的 Prompt 工具使用。

---

## 核心能力一览

| 能力 | 实际表现 |
|------|------|
| 结构化优化 | 输出诊断、评分和优化后的提示词正文 |
| 双视图预览 | 支持纯文本和 Markdown 两种结果视图 |
| 原地编辑 | 可直接编辑优化结果，并回写当前版本 |
| 继续迭代 | 基于当前版本继续优化，而不是重新开始 |
| 版本切换 | 可回看不同迭代版本并切换当前查看版本 |
| 前置条件 | 支持设置全局前置条件，参与优化和迭代 |
| 历史管理 | 查看、加载、重命名、删除、复制已保存记录 |
| 本地持久化 | IndexedDB 主存储，localStorage 降级 |
| 模型兼容 | 兼容 OpenAI Chat Completions 风格接口 |

---

## 适合谁用

- 经常和 GPT、Claude、Gemini 或兼容模型打交道的重度用户
- 需要把自然语言需求稳定转成高质量提示词的产品经理和 AI 应用设计者
- 需要为代码生成、分析、写作、结构化输出建立模板化工作流的开发者
- 希望在本地保留提示词资产，而不是依赖第三方 SaaS 的团队

---

## 技术特点

### 纯前端、可静态部署

项目不依赖自建后端服务，部署方式非常直接：

- 本地开发可用 Vite
- 生产环境可部署到 Nginx、Docker、静态文件服务器
- 只要目标接口兼容 OpenAI Chat Completions，即可接入

### 更贴近工程化使用

和“单次输入、单次复制”的轻量网页不同，PromptForge 已具备一些明显的工程属性：

- 分模式系统提示词设计
- 结构化结果解析与回退策略
- 迭代版链保存
- 本地数据库持久化
- 旧存储迁移与降级容错
- 支持后续扩展搜索、导入导出等本地数据能力

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
| 部署形态 | 纯静态前端，可配合 Nginx / Docker |

---

## 快速开始

```bash
git clone https://github.com/issacchow1111/PromptForge.git
cd PromptForge
npm install
npm run dev
```

默认开发地址：

```bash
http://localhost:5173
```

生产构建：

```bash
npm run build
```

---

## 使用方式

### 1. 配置模型接口

打开页面后，在右上角菜单填写：

- 模型厂商
- 模型名称
- Base URL
- API Key

只要你的接口遵循 OpenAI Chat Completions 风格，就可以接入。

### 2. 选择优化模式

根据任务类型选择合适模式，例如：

- 写代码就用“代码生成”
- 要求 JSON 或表格就用“结构化输出”
- 做分析就用“数据分析”

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

把“帮我写一个登录页面”升级成：明确技术栈、文件范围、输入输出、边界条件、验收标准和禁止改动项的工程化提示词。

### 图像生成

把“画一只猫”升级成：包含主体、风格、镜头、光影、材质和负面提示词的专业图像描述。

### 数据分析

把“帮我分析销量”升级成：明确时间范围、指标定义、对比基准、图表建议和结论结构的分析任务说明。

### 内容写作

把“写一篇小红书文案”升级成：包含目标人群、语气风格、内容结构、篇幅约束和转化目标的可执行提示词。

---

## 项目结构

```text
PromptForge/
├── index.html
├── package.json
├── vite.config.js
├── Dockerfile
├── nginx.conf
├── src/
│   ├── main.js                 # 应用初始化与本地数据迁移
│   ├── App.vue                 # 主工作台：输入、结果、迭代、历史
│   ├── style.css               # 全局视觉样式
│   ├── components/
│   │   ├── PromptInput.vue     # 提示词输入与模式选择
│   │   ├── ResultDisplay.vue   # 结果展示、编辑、继续迭代、版本记录
│   │   ├── FloatMenu.vue       # API 配置与快速历史入口
│   │   ├── HistoryModal.vue    # 历史记录详情与编辑
│   │   ├── Modal.vue           # 通用输入弹窗
│   │   ├── Toast.vue           # 状态提示
│   │   └── PreconditionModal.vue
│   └── utils/
│       ├── api.js              # 优化与迭代请求封装、结果解析
│       ├── promptModes.js      # 7 种模式的系统提示词定义
│       ├── storage.js          # 本地数据访问层
│       ├── db.js               # Dexie / IndexedDB 定义
│       └── migrate.js          # localStorage -> IndexedDB 迁移
└── doc/
```

---

## 为什么这个项目看起来“强”

不是因为它堆了很多概念，而是因为它已经具备了一个真实可用 Prompt 工具该有的几个关键环节：

- 有明确的模式化策略，而不是统一模板套所有场景
- 有结构化诊断和评分，而不是只吐出一段改写文本
- 有继续迭代能力，而不是每次只能重来
- 有版本和历史沉淀，而不是结果即用即丢
- 有本地数据库和迁移逻辑，而不是刷新即丢的 demo
- 有纯前端部署能力，适合私有化和二次开发

这也是 PromptForge 与“普通 Prompt 优化页面”之间最本质的差别。

---

## 注意事项

- 本项目本身不提供模型服务，需要你自行配置可用的 API 接口
- 兼容性基于 OpenAI Chat Completions 风格请求格式，而不是对各家私有 SDK 的直接适配
- 历史数据默认存储在浏览器本地，清除站点数据会影响本地记录

---

## 开发路线

当前版本已经具备完整可用的核心闭环：输入、优化、诊断、迭代、保存、回看。

后续如果继续扩展，很自然的方向包括：

- 历史搜索与过滤
- 数据导入导出入口
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
- compatibility with OpenAI Chat Completions style APIs

It is designed for developers, AI product builders, content creators, and power users who want a private, deployable, front-end-first prompt workflow instead of a one-shot prompt beautifier.
