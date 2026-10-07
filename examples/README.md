# 配套可运行示例 · Runnable Examples

> 面试题库 [docs/](../docs) 中所有代码题与重点场景题的配套实现。**每个示例都经过实跑验证**（2026-10-07，Node v24.17.0 / pnpm 11.10.0 / macOS aarch64），不是仅供阅读的代码片段。

## 环境要求

- Node.js ≥ 18（实测 v24.17.0；JS/算法示例用到顶层 `node:` 协议与现代 ES 特性）
- pnpm ≥ 9（实测 11.10.0；[pnpm-workspace.yaml](pnpm-workspace.yaml) 统一纳管三个需要独立依赖的子工程）
- 浏览器（CSS/可视化示例）；可视化页面需联网加载 cdnjs 上的 ECharts/D3/Three.js
- **无需任何真实 API Key**：AI 与 Next.js 的 LLM/文生图能力全部由本地 mock 实现

## 一键安装

```bash
cd examples
pnpm install --registry=https://registry.npmmirror.com
```

一次安装全部内容：根工具链（tsx / typescript / js-yaml）+ 三个 workspace 子工程（Babel 插件示例、Koa API、Next.js 应用）。

## 运行方式总表

### 01 · JavaScript 底层原理 —— `npx tsx` 直接运行

```bash
npx tsx 01-javascript/i1-macro-micro-order.ts   # 宏/微任务混合顺序（含输出断言）
npx tsx 01-javascript/i2-async-await-order.ts   # async/await 执行顺序
npx tsx 01-javascript/a2-babel-plugin/remove-console.ts  # Babel AST 去 console 插件
```

9 个可运行单元：执行上下文/闭包/Promise/var-let/宏微任务/async-await/长任务分片/AST/Babel 插件。详见 [01-javascript/README.md](01-javascript/README.md)。

### 02 · CSS 底层原理 —— 浏览器打开

```bash
python3 -m http.server 5500
# 打开 http://127.0.0.1:5500/02-css/a1-stacking-context.html
```

8 个可交互页面：盒模型实时测距、优先级四元组、margin 合并（含负值滑块）、BFC 三场景、五种定位、层叠上下文复现、重排 vs 合成帧率对比、sticky 降级。详见 [02-css/README.md](02-css/README.md)。

### 03 · 数据可视化 —— 浏览器打开（CDN）

```bash
python3 -m http.server 5500
# http://127.0.0.1:5500/03-data-visualization/a3-large-data-canvas.html
```

5 个页面：ECharts 基础柱状图 / 双轴柱线混合、D3 enter-update-exit 绑定、Three.js 3D 场景（r128 UMD）、**5 万点 Canvas 全量 vs LTTB 降采样帧率实测** + 万行虚拟列表。详见 [03-data-visualization/README.md](03-data-visualization/README.md)。

### 04 · AI 应用开发 —— 零依赖 mock 服务（端口 3401）

```bash
node 04-ai/server.mjs
# 浏览器：http://127.0.0.1:3401/         （聊天 / 文生图两个 demo）
# 命令行验证 SSE：
curl -N -G --data-urlencode 'prompt=你好' --max-time 4 http://127.0.0.1:3401/api/chat
```

纯 `node:http` 实现：手写 SSE 分帧推送（`data:` 帧 + `[DONE]` + 断连清理）、文生图异步任务状态机（queued→running→done，确定性失败 + 重试）、前端 `ReadableStream` 手写解析与 `AbortController` 中断。详见 [04-ai/README.md](04-ai/README.md)。

### 05 · Node.js —— 零依赖脚本 + Koa 子工程

```bash
# 零依赖脚本，直接 node 运行
node --expose-gc 05-nodejs/b1-fs-path.mjs    # readFileSync vs Stream 内存实测（20MB 文件）
node 05-nodejs/b2-http-server.mjs            # 最小 HTTP 服务（端口 3402）
node 05-nodejs/i2-async-patterns.mjs         # Promise.all/allSettled/race 时间线
printf 'demo-app\nbasic\n' | node 05-nodejs/i3-mini-scaffold/minico.mjs /tmp/demo  # 迷你脚手架

# Koa RESTful API（端口 3403，依赖已随 workspace 安装）
node 05-nodejs/i1-koa-api/server.mjs
```

另有 CJS/ESM「值拷贝 vs 实时绑定」对照（`modules/`）。详见 [05-nodejs/README.md](05-nodejs/README.md)。

### 06 · 全栈开发（Next.js 15）—— 完整工程

```bash
cd 06-nextjs/interview-app
pnpm dev          # http://127.0.0.1:3000 （或 npx next dev -p 3410）
pnpm build        # 生产构建（实测 0 错误，构建摘要可看到 SSG/ISR/SSR/动态标记）
```

覆盖：SSG 首页 / ISR 商品页（revalidate=10 + 按需再生）/ SSR 仪表盘（cookies 强制动态）/ catch-all 文档 SSG / middleware 登录守卫（307 跳转）/ Route Handler / **mock SSE 的 /api/chat + 打字机页面**（零密钥）/ zustand + SWR 状态边界 / Web Vitals 上报占位 / standalone Docker 部署。账号任意，密码 `123456`（或一键演示登录）。详见 [06-nextjs/interview-app/README.md](06-nextjs/interview-app/README.md)。

### 07 · 数据结构与算法 —— 一键自测

```bash
npx tsx 07-algorithms/run-all.ts   # 10 个模块全部断言：输出「全部用例通过：10/10」
```

10 个模块：复杂度实测计时、冒泡、二分查找、二叉树遍历、随机基准快排（10 万数据 ~9ms）、堆排序 + TopK、树操作（翻转/深度/LCA）、手写最小堆、LRU（Map 版 + 双向链表 O(1) 版）、前端场景算法（虚拟滚动二分/LIS/WeakMap 深拷贝）。单文件也可独立运行。详见 [07-algorithms/README.md](07-algorithms/README.md)。

### 08 · CI/CD —— workflow 样例

```bash
# YAML 合法性校验（根依赖 js-yaml）
node --input-type=module -e "import yaml from 'js-yaml';import fs from 'node:fs';for(const f of fs.readdirSync('08-cicd/workflows').filter(x=>x.endsWith('.yml'))){yaml.load(fs.readFileSync('08-cicd/workflows/'+f,'utf8'));console.log('ok',f)}"
```

6 个可直接复制到 `.github/workflows/` 的样例：最简流水线、矩阵全 CI（Node 18/20/22 + artifact）、门禁规则、四环境多环境发布（production 审批）、全链路质量（Lighthouse/依赖审计/密钥扫描）、CNB 云原生构建（注释化样例）。详见 [08-cicd/workflows/README.md](08-cicd/workflows/README.md)。

## 端口一览

| 端口 | 服务 |
|------|------|
| 3401 | 04-ai mock SSE / 文生图服务 |
| 3402 | 05-nodejs 最小 HTTP 服务 |
| 3403 | 05-nodejs Koa RESTful API |
| 3410 | 06-nextjs 验证用端口（默认 `pnpm dev` 为 3000） |
| 5500/5512 | CSS/可视化静态服务器（按需启动） |

## 目录结构

```
examples/
├── package.json              # 根工具链：tsx / typescript / js-yaml
├── pnpm-workspace.yaml       # 纳管 a2-babel-plugin、i1-koa-api、interview-app
├── tsconfig.json
├── 01-javascript/            # 9 个 tsx 单元 + Babel 插件子工程
├── 02-css/                   # 8 个静态 HTML
├── 03-data-visualization/    # 5 个静态 HTML（cdnjs CDN）
├── 04-ai/                    # 零依赖 mock 服务 + 前端页面
├── 05-nodejs/                # 零依赖脚本 + modules/ + Koa 子工程 + 迷你脚手架
├── 06-nextjs/interview-app/  # Next.js 15 + React 19 完整工程
├── 07-algorithms/            # 10 个算法模块 + run-all.ts
└── 08-cicd/workflows/        # 6 个 GitHub Actions / CNB 样例
```
