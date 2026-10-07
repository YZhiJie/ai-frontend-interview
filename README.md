# AI 前端面试题库 · AI-Era Frontend Interview

> 面向 AI 时代的前端开发工程师综合能力评估面试题集。覆盖 8 大技术领域、82 道分级题目、8 幅漫画式教程，适用于中高级前端开发工程师岗位的招聘选拔与自学提升。

## ✨ 特性

- **三级难度分层**：每个领域按 Basic / Intermediate / Advanced 三级组织，难度递进清晰
- **四要素题目结构**：每题包含问题描述、考察要点、参考答案要点、难度评级
- **六类题型覆盖**：理论概念题、代码分析题、实际场景应用题、技术选型题、架构设计题、代码审查题（AI 产出审查专项）
- **AI 时代视角**：题目融入 LLM 应用、智能体、流式渲染等 AI 时代前端新命题
- **漫画式教程**：每领域配套一幅四格漫画（1200×840 SVG），让核心概念一眼看懂
- **可运行示例**：[examples/](examples/) 提供全部代码题的配套实现（tsx 脚本 / 静态 HTML / mock 服务 / Next.js 15 完整工程），均实跑验证，**无需真实 API Key**
- **门禁校验**：漫画 SVG 通过 `node comics/check-comics.mjs` 自动校验良构性与文本溢出

## 📚 领域导航

| # | 领域 | 文档 | 题数（B/I/A） | 配套漫画 |
|---|------|------|--------------|----------|
| 1 | JavaScript 底层原理 | [docs/01-javascript.md](docs/01-javascript.md) | 12（5/4/3） | [EP.01 JS 事件循环](comics/ep01-js-event-loop.svg) |
| 2 | CSS 底层原理 | [docs/02-css.md](docs/02-css.md) | 9（3/3/3） | [EP.02 CSS 层叠上下文](comics/ep02-css-stacking.svg) |
| 3 | 数据可视化技术 | [docs/03-data-visualization.md](docs/03-data-visualization.md) | 10（3/3/4） | [EP.03 Canvas vs SVG](comics/ep03-viz-canvas-svg.svg) |
| 4 | AI 应用开发 | [docs/04-ai-development.md](docs/04-ai-development.md) | 13（3/4/6） | [EP.04 SSE 流式输出](comics/ep04-ai-sse.svg) |
| 5 | Node.js 开发能力 | [docs/05-nodejs.md](docs/05-nodejs.md) | 9（3/3/3） | [EP.05 Node 事件循环](comics/ep05-node-eventloop.svg) |
| 6 | 全栈开发（Next.js） | [docs/06-fullstack-nextjs.md](docs/06-fullstack-nextjs.md) | 9（3/3/3） | [EP.06 SSR/SSG/ISR 选型](comics/ep06-nextjs-rendering.svg) |
| 7 | 数据结构与算法 | [docs/07-algorithms.md](docs/07-algorithms.md) | 11（4/4/3） | [EP.07 排序复杂度之旅](comics/ep07-algo-sorting.svg) |
| 8 | CI/CD 自动化 | [docs/08-cicd.md](docs/08-cicd.md) | 9（3/3/3） | [EP.08 CI/CD 流水线](comics/ep08-cicd-pipeline.svg) |

**合计：82 题**（Basic 27 · Intermediate 27 · Advanced 28）

## 📊 难度评级说明

| 级别 | 星级 | 能力定位 |
|------|------|----------|
| Basic | ★★☆☆☆ | 概念清晰、基础扎实，能准确复述原理 |
| Intermediate | ★★★☆☆ ~ ★★★★☆ | 深入机制、能分析代码执行结果并解决实际问题 |
| Advanced | ★★★★★（个别 ★★★★☆） | 架构思维、性能优化与复杂场景方案设计能力 |

## 🧩 题目结构说明

每道题目均包含四个要素，示例：

```markdown
### JS-I1｜宏任务与微任务的执行顺序

- **题型**：代码分析题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  （清晰的题目描述，代码题附代码块）
- **考察要点**：
  - （3-5 条核心考察点）
- **参考答案要点**：
  - （4-8 条精炼要点，突出核心知识点）
```

## 🎯 使用方法

**面试官视角**
1. 按岗位要求选择 2-3 个领域，每个领域从 Basic → Advanced 逐级提问
2. 同一领域候选人答对两级后再进入下一级，快速定位能力边界
3. 参考答案要点可作为评分锚点：覆盖 70% 以上为合格，能延伸扩展为优秀

**候选人视角**
1. 先自测：遮住参考答案，按领域过题并口述答案
2. 对照参考答案要点查漏补缺，重点复习"考察要点"中列出的机制
3. 配套漫画用于快速建立直觉，适合面试前 30 分钟快速回顾

## 🎬 漫画教程

`comics/` 目录下每领域一幅四格漫画（霓虹墨 NEON INK 风格），前两格讲原理、第三格给实证、第四格总结坑点（橙色标签）与"码叔总结"。

**推荐用整合阅读器观看**（复刻自 frontend-advanced-guide 漫画剧场）：

```bash
# 阅读器通过 fetch 加载资源，需经本地服务器访问（file:// 直开被浏览器拦截）
python3 -m http.server 8899
# 打开 http://127.0.0.1:8899/comics/index.html
```

阅读器能力：封面一键进入 + 继续阅读（localStorage 记忆进度）、**翻页 / 长卷双模式**（快捷键 M）、侧边 8 话目录与已读标记、键盘 ←/→/Home/End 导航、每话右侧**讲解抽屉**（剧情回顾/知识点拆解/坑点清单/自测题，Esc 关闭）、SVG 内联矢量缩放、按需加载 + 相邻话预取、单话失败独立重试。也可直接从各领域文档顶部的链接打开单幅 SVG。

## 🧪 可运行示例

所有代码题均有配套实现，见 **[examples/README.md](examples/README.md)**（含完整运行手册）：

- `npx tsx 07-algorithms/run-all.ts` —— 10 个算法模块一键自测
- `node 04-ai/server.mjs` —— mock SSE 聊天 + 文生图（端口 3401，零密钥）
- `pnpm --dir 06-nextjs/interview-app dev` —— Next.js 15 完整工程（SSG/ISR/SSR/中间件/SSE）
- CSS/可视化为静态 HTML，`python3 -m http.server` 即可打开

## ✅ 质量门禁

```bash
# 漫画校验（良构性 / viewBox / 显式 font-size / 单行宽度 ≤545px / 禁用元素）
node comics/check-comics.mjs

# 示例一键安装（pnpm workspace 统一纳管三个子工程）
cd examples && pnpm install
```

## 🗂 目录结构

```
ai-frontend-interview/
├── README.md                          # 项目总览与导航
├── docs/                              # 8 大领域面试题文档
│   ├── 01-javascript.md
│   ├── 02-css.md
│   ├── 03-data-visualization.md
│   ├── 04-ai-development.md
│   ├── 05-nodejs.md
│   ├── 06-fullstack-nextjs.md
│   ├── 07-algorithms.md
│   └── 08-cicd.md
├── comics/                            # 漫画式教程 + 整合阅读器
│   ├── index.html                     # 漫画剧场阅读器（双模式/讲解抽屉/进度记忆）
│   ├── manifest.json                  # 话数清单（slug/title/正文 part 映射）
│   ├── check-comics.mjs               # 门禁校验脚本（SVG 良构 + MD 完整性）
│   ├── ep01-js-event-loop.svg + .md   # 每话：SVG 原画 + 讲解 Markdown
│   ├── ep02-css-stacking.svg + .md
│   ├── ep03-viz-canvas-svg.svg + .md
│   ├── ep04-ai-sse.svg + .md
│   ├── ep05-node-eventloop.svg + .md
│   ├── ep06-nextjs-rendering.svg + .md
│   ├── ep07-algo-sorting.svg + .md
│   └── ep08-cicd-pipeline.svg + .md
└── examples/                          # 配套可运行示例（详见 examples/README.md）
    ├── package.json                   # pnpm workspace 根（tsx/typescript/js-yaml）
    ├── 01-javascript/                 # 9 个 tsx 单元 + Babel AST 插件子工程
    ├── 02-css/                        # 8 个可交互静态 HTML
    ├── 03-data-visualization/         # 5 个 ECharts/D3/Three/Canvas 页面
    ├── 04-ai/                         # 零依赖 mock SSE + 文生图服务
    ├── 04-ai-review-dojo/             # AI 代码审查道场（雷源码/答案分离 + 攻防复现）
    ├── 05-nodejs/                     # 零依赖脚本 + Koa REST API + 迷你脚手架
    ├── 06-nextjs/interview-app/       # Next.js 15 + React 19 完整工程
    ├── 07-algorithms/                 # 10 个算法模块 + run-all.ts 一键自测
    └── 08-cicd/workflows/             # 6 个 GitHub Actions / CNB 流水线样例
```

## 📌 版本记录

- **v1.3.0**（2026-10-07）：新增「审查 AI 代码」专项三题（[AI-I4/A5/A6](docs/04-ai-development.md)：流式组件找茬、Agent 工具安全审查、架构 slop PR 处置），配套 [examples/04-ai-review-dojo](examples/04-ai-review-dojo/) 审查道场——雷源码与答案分离，含字节切点穷举、间接注入攻击链等可运行复现（3/3 实跑通过），总题量 79→82
- **v1.2.0**（2026-10-07）：漫画教程升级为整合阅读器（[comics/index.html](comics/index.html)）——翻页/长卷双模式、讲解抽屉、进度记忆、键盘导航、按需预取；新增 8 话讲解 MD（剧情回顾/知识点拆解/坑点清单/自测题），门禁扩展 MD 完整性校验
- **v1.1.0**（2026-10-07）：新增 [examples/](examples/) 配套可运行示例——40+ 可运行单元，覆盖全部 8 领域（tsx 脚本/静态 HTML/mock 服务/Koa/Next.js 15 完整工程/workflow 样例），经实跑验证
- **v1.0.0**（2026-10-07）：首发 8 大领域 79 道分级面试题 + 8 幅漫画教程 + 门禁校验脚本
