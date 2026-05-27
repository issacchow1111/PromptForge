# PromptForge —— 提示词锻造工坊

> 让每一句提示词，都精准命中 AI 的「理解穴位」。

---

## 这是什么？

**PromptForge** 是一款面向 AI 提示词工程师、产品经理、内容创作者及所有重度 AI 用户的**智能提示词优化工具**。

它不止是一个「润色器」—— 它是一位 7×24 小时在线的**提示词架构师**，通过大模型深度理解你的原始意图，自动补全逻辑缺口、规范表达结构、强化输出约束，将你的「大白话」锻造成**结构清晰、语义精准、可直接投产**的专业级提示词。

---

## 核心能力

### 1. 智能语义重构
基于专业提示词工程方法论，自动识别并修复：
- **角色模糊** → 明确 AI 身份与能力边界
- **任务缺失** → 补全指令逻辑链
- **约束不足** → 强化输出格式与质量要求
- **语义空白** → 填补上下文与示例缺口

### 2. 双模式结果预览
- **纯文本模式**：干净清爽，一键复制即用
- **Markdown 渲染模式**：结构化呈现，层级一目了然

### 3. 实时编辑与迭代
优化结果不满意？支持**原地编辑**，所见即所得，改完即存。

### 4. 历史记录管理
- 自动保存每次优化成果，支持**自定义命名**
- 侧滑抽屉式历史面板，**查看 / 加载 / 复制 / 重命名 / 删除**一键操作
- 本地持久化存储，刷新不丢失

### 5. 多厂商 API 兼容
支持任意兼容 OpenAI Chat Completions 接口的模型服务：
- OpenAI (GPT-4o / GPT-4o-mini / o3-mini ...)
- Anthropic Claude
- Google Gemini
- 阿里云百炼、火山引擎、SiliconFlow 等国内中转
- 自建 vLLM / Ollama 本地模型

配置一次，自动记忆，开箱即用。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 (Composition API) |
| 构建工具 | Vite 5 |
| 样式方案 | 原生 CSS + CSS Variables 主题系统 |
| Markdown 渲染 | marked + DOMPurify |
| 数据持久化 | localStorage |
| 部署 | 纯静态，Nginx / Docker / Vercel 均可 |

---

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/issacchow1111/PromptForge.git
cd PromptForge

# 安装依赖
npm install

# 本地开发
npm run dev

# 构建生产包
npm run build
```

打开浏览器访问 `http://localhost:5173`，点击右上角菜单配置你的 API 信息，即可开始优化。

---

## 使用场景

| 场景 | 效果 |
|------|------|
| **AI 绘画 Prompt** | 将「画一只猫」优化为含风格、构图、光影、材质的专业描述 |
| **代码生成** | 补全技术栈、约束条件、输出格式，让 AI 一次写对 |
| **数据分析** | 明确统计口径、输出维度、可视化要求 |
| **内容创作** | 规范文章结构、语气风格、目标受众 |
| **智能客服** | 定义角色边界、知识范围、拒绝策略 |

---

## 项目结构

```
PromptForge/
├── index.html              # 入口 HTML
├── vite.config.js          # Vite 配置
├── package.json
├── src/
│   ├── main.js             # 应用入口
│   ├── App.vue             # 根组件
│   ├── style.css           # 全局样式与主题变量
│   ├── components/         # 组件目录
│   │   ├── PromptInput.vue      # 提示词输入区
│   │   ├── ResultDisplay.vue    # 优化结果展示区
│   │   ├── FloatMenu.vue        # 悬浮菜单（API 配置 + 历史记录）
│   │   ├── HistoryDrawer.vue    # 全屏历史抽屉
│   │   ├── HistoryModal.vue     # 历史详情弹窗
│   │   ├── Modal.vue            # 通用弹窗
│   │   └── Toast.vue            # 轻提示
│   └── utils/
│       ├── api.js          # API 调用封装
│       └── storage.js      # localStorage 操作
```

---

## 设计理念

> **「提示词是人与 AI 之间的协议。」**

PromptForge 的设计哲学是：把提示词工程中最耗时、最依赖经验的「结构化」工作交给 AI，让人专注于**意图表达**本身。

- **零配置上手**：打开即用，无需注册，数据本地存储
- **极简交互**：输入 → 优化 → 复制，三步完成
- **专业输出**：背后由系统级 Prompt 驱动，确保每次优化都符合最佳实践

---

## 许可证

MIT License © 2025 issacchow1111

---

> **PromptForge** —— 锻造提示词，释放 AI 的完整潜能。
