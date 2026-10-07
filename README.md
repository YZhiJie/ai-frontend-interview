# AI 前端面试题库 · AI-Era Frontend Interview

> 面向 AI 时代的前端开发工程师综合能力评估面试题集。覆盖 8 大技术领域、79 道分级题目、8 幅漫画式教程，适用于中高级前端开发工程师岗位的招聘选拔与自学提升。

## ✨ 特性

- **三级难度分层**：每个领域按 Basic / Intermediate / Advanced 三级组织，难度递进清晰
- **四要素题目结构**：每题包含问题描述、考察要点、参考答案要点、难度评级
- **五类题型覆盖**：理论概念题、代码分析题、实际场景应用题、技术选型题、架构设计题
- **AI 时代视角**：题目融入 LLM 应用、智能体、流式渲染等 AI 时代前端新命题
- **漫画式教程**：每领域配套一幅四格漫画（1200×840 SVG），让核心概念一眼看懂
- **门禁校验**：漫画 SVG 通过 `node comics/check-comics.mjs` 自动校验良构性与文本溢出

## 📚 领域导航

| # | 领域 | 文档 | 题数（B/I/A） | 配套漫画 |
|---|------|------|--------------|----------|
| 1 | JavaScript 底层原理 | [docs/01-javascript.md](docs/01-javascript.md) | 12（5/4/3） | [EP.01 JS 事件循环](comics/ep01-js-event-loop.svg) |
| 2 | CSS 底层原理 | [docs/02-css.md](docs/02-css.md) | 9（3/3/3） | [EP.02 CSS 层叠上下文](comics/ep02-css-stacking.svg) |
| 3 | 数据可视化技术 | [docs/03-data-visualization.md](docs/03-data-visualization.md) | 10（3/3/4） | [EP.03 Canvas vs SVG](comics/ep03-viz-canvas-svg.svg) |
| 4 | AI 应用开发 | [docs/04-ai-development.md](docs/04-ai-development.md) | 10（3/3/4） | [EP.04 SSE 流式输出](comics/ep04-ai-sse.svg) |
| 5 | Node.js 开发能力 | [docs/05-nodejs.md](docs/05-nodejs.md) | 9（3/3/3） | [EP.05 Node 事件循环](comics/ep05-node-eventloop.svg) |
| 6 | 全栈开发（Next.js） | [docs/06-fullstack-nextjs.md](docs/06-fullstack-nextjs.md) | 9（3/3/3） | [EP.06 SSR/SSG/ISR 选型](comics/ep06-nextjs-rendering.svg) |
| 7 | 数据结构与算法 | [docs/07-algorithms.md](docs/07-algorithms.md) | 11（4/4/3） | [EP.07 排序复杂度之旅](comics/ep07-algo-sorting.svg) |
| 8 | CI/CD 自动化 | [docs/08-cicd.md](docs/08-cicd.md) | 9（3/3/3） | [EP.08 CI/CD 流水线](comics/ep08-cicd-pipeline.svg) |

**合计：79 题**（Basic 24 · Intermediate 26 · Advanced 29）

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

`comics/` 目录下每领域一幅四格漫画（霓虹墨 NEON INK 风格），前两格讲原理、第三格给实证、第四格总结坑点（橙色标签）与"码叔总结"。可通过浏览器直接打开 SVG，或从各领域文档顶部的链接进入。

## ✅ 质量门禁

```bash
# 漫画校验（良构性 / viewBox / 显式 font-size / 单行宽度 ≤545px / 禁用元素）
node comics/check-comics.mjs
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
└── comics/                            # 漫画式教程
    ├── manifest.json                  # 话数清单
    ├── check-comics.mjs               # 门禁校验脚本
    ├── ep01-js-event-loop.svg
    ├── ep02-css-stacking.svg
    ├── ep03-viz-canvas-svg.svg
    ├── ep04-ai-sse.svg
    ├── ep05-node-eventloop.svg
    ├── ep06-nextjs-rendering.svg
    ├── ep07-algo-sorting.svg
    └── ep08-cicd-pipeline.svg
```

## 📌 版本记录

- **v1.0.0**（2026-10-07）：首发 8 大领域 79 道分级面试题 + 8 幅漫画教程 + 门禁校验脚本
