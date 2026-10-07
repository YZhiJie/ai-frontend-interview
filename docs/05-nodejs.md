# 五、Node.js 开发能力

> 本领域考察前端工程师向服务端延伸的核心能力：以事件循环与流为基础的运行时心智模型、核心模块与 Web 框架的实战运用、以及工程化工具与服务端架构的设计能力。在 AI 应用大量依赖 Node 做流式代理、CLI 工具链与 BFF 层的今天，这些能力直接决定中高级前端工程师的全栈上限。

**题量分布**：Basic 3 题 · Intermediate 3 题 · Advanced 3 题（共 9 题）

**🎬 配套漫画**：[EP.05 Node 事件循环](../comics/ep05-node-eventloop.svg)

---

## 🟢 Basic（基础）

### NODE-B1｜fs 模块基础：readFile / readFileSync / createReadStream 的选择与 path 防坑

- **题型**：实际场景应用题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  场景约束：一个 Node 服务需要 ① 启动时读取几 KB 的 JSON 配置文件，② 处理用户上传的约 2GB 日志文件并逐行解析入库。请说明 `readFile` / `readFileSync` / `createReadStream` 三者的差异与各自适用场景，并解释为什么大文件必须用流；再说明 `path.join` / `path.resolve` / `path.extname` 的作用，并指出 `'./a' + '/' + fileName` 这类手动拼接路径的风险。
- **考察要点**：
  - 三种读取方式在内存占用与阻塞行为上的差异
  - 流式读取对大文件的意义与背压（backpressure）机制
  - path 三个常用 API 的语义差异（相对路径基准不同）
  - 手动字符串拼接路径的跨平台与安全问题
- **参考答案要点**：
  - `readFile` 一次性把整个文件读入内存后回调返回，写法简单，适合小文件；大文件会造成内存峰值甚至 OOM。
  - `readFileSync` 同步阻塞事件循环，只适合启动期读配置、CLI 脚本等一次性场景，绝不能放进请求处理路径。
  - `createReadStream` 按 chunk（默认 64KB）读取，内存占用恒定，配合 `readline` 可逐行解析超大日志；接入响应管道即可边读边发。
  - 背压：消费速度慢于生产速度时流会自动暂停读取，`write()` 返回 false 时应等待 `drain` 事件，`pipeline` 已内置该处理。
  - `path.join` 拼接并规范化路径；`path.resolve` 从右向左解析直到得到绝对路径（以 cwd 或遇到的绝对段为基准）；`path.extname` 取扩展名。
  - 手动拼接易出现重复斜杠、未处理的 `..` 与 Windows 分隔符问题，拼接用户输入还有路径穿越（path traversal）风险；应统一用 `join`/`normalize` 并校验结果仍在目标目录内。

### NODE-B2｜用 http 核心模块实现一个最小 Web 服务

- **题型**：实际场景应用题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  场景约束：不借助任何第三方框架，用 `http` 核心模块实现一个服务：`GET /api/time` 返回 `{ code: 0, data: { time } }` 的 JSON；其余路径一律返回 404 的 JSON 错误信息；服务监听 3000 端口。请写出关键代码，并说明 `req`/`res` 的基本用法。
  ```js
  const http = require('http');

  const server = http.createServer((req, res) => {
    // 只允许 GET 请求
    if (req.method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ code: 1, message: 'Method Not Allowed' }));
    }
    // 去掉查询串后再匹配路径
    const { pathname } = new URL(req.url, 'http://localhost');

    if (pathname === '/api/time') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ code: 0, data: { time: new Date().toISOString() } }));
    } else {
      // 404 兜底
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ code: 1, message: 'Not Found' }));
    }
  });

  server.listen(3000, () => console.log('listening on 3000'));
  ```
- **考察要点**：
  - `createServer` 回调中 req（IncomingMessage）与 res（ServerResponse）的职责划分
  - URL 解析与最简路由匹配的实现方式
  - 手动设置状态码与 Content-Type 等响应头
  - 端口监听与 error 事件（如 EADDRINUSE）的处理
- **参考答案要点**：
  - `req` 是可读流：`req.method` / `req.url` / `req.headers` 描述请求元信息，POST body 需通过 `data`/`end` 事件分块收集。
  - `res` 是可写流：`writeHead` 一次性写入状态码与响应头，`write`/`end` 输出响应体，`end` 之后不可再写。
  - 返回 JSON 必须设置 `Content-Type: application/json`（建议带 charset），否则客户端可能按纯文本解析。
  - 用 `new URL(req.url, base)` 可同时拿到 `pathname` 与 `searchParams`，比手写 indexOf 切割更稳。
  - `server.listen(3000)` 启动监听，端口被占用会触发 `error` 事件（EADDRINUSE），应监听并给出可读提示或自动换端口。
  - Express/Koa 本质是对这套 req/res 原语做封装与中间件编排，理解原语才看得懂框架行为。

### NODE-B3｜CommonJS 与 ES Module 的核心差异

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请从加载机制、导出绑定方式、模块顶层 `this` 指向、循环依赖处理、顶层 await 支持、`package.json` 的 `type` 字段六个角度，系统对比 CommonJS 与 ES Module。
- **考察要点**：
  - 静态结构与动态加载的本质区别（tree-shaking 的前提）
  - 值拷贝与实时绑定的行为差异
  - 循环依赖在两种模块体系下的表现
  - 模块格式的判定规则（.mjs/.cjs 与 type 字段）
- **参考答案要点**：
  - CJS 运行时动态加载，`require` 可写在条件与函数内；ESM 在编译期静态确定依赖，`import` 必须顶层声明、动态加载需 `import()`，静态性是 tree-shaking 的前提。
  - CJS 导出的是 `module.exports` 的值拷贝，导出后模块内部再变化不影响已引入方；ESM 导出的是实时绑定的引用，外部读到的是最新值。
  - CJS 顶层 `this` 是 `module.exports`（当前模块导出对象）；ESM 顶层 `this` 是 `undefined`。
  - 循环依赖：CJS 依赖 require.cache，后加载方可能拿到"半成品" exports；ESM 靠引用绑定与声明提升消化，函数声明可正常互调，但访问未初始化的 const/let 会抛 TDZ 错误。
  - 顶层 await 仅 ESM 支持（模块异步求值），CJS 中直接报语法错误。
  - 格式判定：`.mjs` 恒为 ESM、`.cjs` 恒为 CJS；`.js` 取决于最近的 `package.json` 的 `type` 字段（`module` 为 ESM，缺省为 commonjs）。

## 🟡 Intermediate（进阶）

### NODE-I1｜基于 Express 或 Koa 开发规范化的 RESTful API

- **题型**：实际场景应用题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  场景约束：为一个用户管理模块设计 RESTful API，要求：① 路由按 `/api/v1` 版本化；② 创建用户时对 username / password 做参数校验；③ 响应统一为 `{ code, message, data }` 格式；④ 任何未捕获错误都由全局错误中间件兜底返回 JSON。请选择 Express 或 Koa 之一实现关键代码，并说明选择理由（若选 Koa 需解释洋葱模型）。
  ```ts
  // app.ts —— 选 Koa：原生 async/await，洋葱模型天然适配"统一响应 + 全局错误"
  import Koa from 'koa';
  import Router from '@koa/router';
  import bodyParser from 'koa-bodyparser';

  const app = new Koa();
  const router = new Router({ prefix: '/api/v1' }); // ① URL 前缀做路由版本化

  const ok = (data: unknown) => ({ code: 0, message: 'ok', data }); // ② 统一响应结构

  // ③ 全局错误中间件：第一个注册 = 洋葱最外层，兜住所有内层抛出的异常
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err: any) {
      ctx.status = err.status ?? 500;
      ctx.body = { code: 1, message: err.message || 'Internal Server Error' };
    }
  });

  // ④ 参数校验中间件（也可换成 joi / zod 的 schema 校验）
  const validate = (rules: Record<string, (v: any) => boolean>) =>
    async (ctx: Koa.Context, next: () => Promise<void>) => {
      for (const [key, check] of Object.entries(rules)) {
        if (!check(ctx.request.body?.[key])) ctx.throw(400, `参数 ${key} 不合法`);
      }
      await next();
    };

  router.post(
    '/users',
    validate({
      username: (v) => typeof v === 'string' && v.length >= 3,
      password: (v) => typeof v === 'string' && v.length >= 6,
    }),
    (ctx) => {
      ctx.body = ok({ id: 1, username: ctx.request.body.username }); // 省略入库
    },
  );

  app.use(bodyParser());
  app.use(router.routes()).use(router.allowedMethods());
  app.listen(3000);
  ```
- **考察要点**：
  - Express 线性中间件模型与 Koa 洋葱模型的差异
  - 路由版本化的常见方案（URL 前缀、目录分组）
  - 参数校验逻辑前置为可复用中间件的思路
  - 全局错误兜底与统一响应结构的设计
- **参考答案要点**：
  - 选型理由（示例）：Koa 原生 async/await、洋葱模型让"请求前/响应后"逻辑（日志、计时、错误兜底）非常自然；Express 生态更全、普及度更高，按团队熟悉度二选一即可。
  - 洋葱模型：中间件按注册顺序嵌套，`await next()` 之前是"进入"阶段、之后是"返回"阶段；因此错误中间件必须第一个注册才能兜住内层异常，而 Express 靠四参错误中间件（err, req, res, next）捕获。
  - 版本化：URL 前缀（/api/v1）最直观，配合路由目录按版本分目录（routes/v1/…）管理；也可用请求头版本 + 路由映射，但可读性与调试体验差。
  - 参数校验：抽成高阶中间件或用 joi/zod 定义 schema，失败统一 `ctx.throw(400)`，避免业务代码里散落 if 判断。
  - 统一响应：提供 ok/fail 助手函数或挂到 ctx 上，保证 `{ code, message, data }` 结构由一处维护，前端可按 code 做统一拦截。
  - 全局错误中间件：区分业务错误（带 err.status 的 4xx）与未知错误（记日志、对外返回 500 并隐藏堆栈），防止进程崩溃与敏感信息泄露。

### NODE-I2｜三代异步模式对比与并发代码分析

- **题型**：理论概念题+代码分析题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  第一部分：对比回调函数、Promise、async/await 三代异步模式在错误处理与可读性上的差异，并说明 `Promise.all` / `allSettled` / `race` 各自的适用场景。第二部分：分析下面代码的输出顺序与结果，指出体现的并发语义。
  ```js
  function fetchUser(id, delay, shouldFail = false) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 用定时器模拟一次异步请求
        shouldFail ? reject(new Error(`user-${id} 失败`)) : resolve(`user-${id}`);
      }, delay);
    });
  }

  async function main() {
    // 三个 Promise 在 await 之前已创建，因此是并发执行
    const p1 = fetchUser(1, 100);
    const p2 = fetchUser(2, 50, true);
    const p3 = fetchUser(3, 150);

    const r1 = await Promise.all([p1, p2, p3]).catch((e) => e.message);
    const r2 = await Promise.allSettled([p1, p2, p3]);
    const r3 = await Promise.race([p1, p3]);

    console.log(r1);
    console.log(r2.map((s) => s.status));
    console.log(r3);
  }
  main();
  ```
- **考察要点**：
  - 回调地狱与错误处理分散的核心问题
  - async/await 的 try/catch 语义与 then 链的等价关系
  - all / allSettled / race 的语义与失败传播行为
  - "先创建 Promise 再 await" 与串行 await 的并发差异
- **参考答案要点**：
  - 回调模式：错误要在每个回调里显式判断（error-first 约定），多层嵌套形成回调地狱，还存在控制反转（可能丢失或重复调用）问题。
  - Promise 统一了异步值与错误通道，`.then/.catch/.finally` 链式解决嵌套；async/await 是其语法糖，用 try/catch 恢复同步书写习惯，但循环里逐个 await 会把并发退化成串行。
  - `Promise.all`：任一失败立即整体 reject（fail-fast），适合"必须全部成功"的并行请求，如聚合多个必需接口。
  - `Promise.allSettled`：等待全部落定并返回 `{ status, value/reason }` 数组，适合部分失败可容忍的批量任务，如批量推送通知。
  - `Promise.race`：第一个落定者胜出（无论成败），适合超时控制，如与定时 reject 的 timer 竞速。
  - 输出分析：三个请求并发执行；p2 在 50ms 失败使 Promise.all 整体失败，r1 输出 `user-2 失败`；allSettled 保持原顺序输出 `['fulfilled', 'rejected', 'fulfilled']`；race 中 p1（100ms）先落定，r3 输出 `user-1`（同一 Promise 多次消费会复用已缓存的结果）。

### NODE-I3｜前端脚手架工具的设计与实现

- **题型**：架构设计题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  设计一个类似 create-vue 的项目脚手架 CLI：支持 `my-cli create <name>` 创建项目，交互式询问框架选型与是否安装依赖，拉取远程模板，最后初始化 git 并安装依赖。请给出模块划分、执行流程与关键代码（命令注册 + 交互问答 + 模板下载）。
  ```js
  #!/usr/bin/env node
  // bin/cli.js —— CLI 入口
  const { program } = require('commander');
  const create = require('../lib/create');

  program
    .command('create <app-name>')      // 注册 create 命令
    .description('创建一个新项目')
    .action((name) => create(name));   // 分发到核心逻辑

  program.parse(process.argv);
  ```
  ```js
  // lib/create.js —— 核心流程：问答 → 下载模板 → 装依赖 → 初始化 git
  const path = require('path');
  const fs = require('fs');
  const inquirer = require('inquirer');
  const { downloadTemplate, installDeps, initGit } = require('./utils');

  module.exports = async function create(name) {
    const targetDir = path.join(process.cwd(), name);
    if (fs.existsSync(targetDir)) {
      // 目录冲突确认，避免误覆盖
      const { overwrite } = await inquirer.prompt([
        { type: 'confirm', name: 'overwrite', message: '目录已存在，是否覆盖？' },
      ]);
      if (!overwrite) return process.exit(0);
    }

    // 交互式收集配置
    const answers = await inquirer.prompt([
      { type: 'list', name: 'framework', message: '选择框架：', choices: ['vue', 'react'] },
      { type: 'confirm', name: 'needInstall', message: '是否安装依赖？' },
    ]);

    await downloadTemplate(answers.framework, targetDir); // 拉取模板（degit / download-git-repo）
    // 可将 answers 写入模板变量，替换 package.json 的 name 等字段
    if (answers.needInstall) await installDeps(targetDir); // spawn('npm', ['install'])
    await initGit(targetDir);                              // spawn('git', ['init']) 并创建初始提交
    console.log(`项目 ${name} 创建完成`);
  };
  ```
- **考察要点**：
  - CLI 工具的模块划分（入口 / 命令 / 交互 / 模板 / 工具函数）
  - commander 与 inquirer 的协作方式
  - 模板获取方案（degit、download-git-repo、npm 包）与变量替换
  - 子进程执行依赖安装与 git 初始化的健壮性
- **参考答案要点**：
  - 模块划分：bin 入口只做命令注册与分发，commands 承载命令实现，lib 工具层负责模板下载、依赖安装、git 操作与日志，职责单一便于测试。
  - commander 负责命令/参数解析与帮助信息，inquirer 负责交互问答；action 中把命令参数与问答结果合并为统一的配置上下文。
  - 模板获取：优先用 degit / download-git-repo 拉取指定仓库 tag（快、可缓存），也可把模板发布成 npm 包按需下载；下载后按 answers 做文件级变量替换（如 package.json 的 name）。
  - 依赖安装与 git 初始化用 spawn/execa 起子进程，透传 stdio 并处理非零退出码；用户选择跳过安装时，结束时打印后续命令提示。
  - 体验细节：目录冲突确认、创建中 loading（ora）、失败时清理半成品目录、结束打印"下一步"指引。
  - 工程化延伸：支持 `--template` / `--force` 参数跳过交互，便于在 CI 中无人值守使用；可加离线模板缓存提升二次创建速度。

## 🔴 Advanced（高级）

### NODE-A1｜Nest.js 模块化应用架构与请求生命周期

- **题型**：架构设计题
- **难度**：Advanced ★★★★★
- **问题描述**：
  请设计一个基于 Nest.js 的中大型后端应用架构：说明 Module / Controller / Provider 三层职责与依赖注入（DI）的实现原理；给出中间件（Middleware）、守卫（Guard）、拦截器（Interceptor）、管道（Pipe）、异常过滤器（Exception Filter）的执行顺序与职能边界；并给出按业务域拆分模块的策略（含共享模块与全局模块的处理）。
- **考察要点**：
  - 三层职责划分与模块依赖图的组织方式
  - DI 容器基于装饰器元数据的解析原理
  - 请求生命周期中各组件的先后顺序与终止能力
  - 大型应用的模块拆分与依赖治理策略
- **参考答案要点**：
  - 三层职责：Controller 只做路由与参数接收；Provider（Service/Repository）承载业务与数据访问；Module 是组织单元，通过 providers/imports/exports 声明模块依赖图。
  - DI 原理：类被 Nest 容器实例化为单例存入注入器容器，构造函数依据 TypeScript 装饰器元数据（emitDecoratorMetadata 生成的 design:paramtypes 或 @Inject 指定的 token）解析并递归创建依赖，形成可替换、可 Mock 的依赖图。
  - 请求生命周期顺序：Middleware → Guard → Interceptor（前置）→ Pipe（参数校验转换）→ Controller 处理 → Interceptor（后置/响应映射）→ 异常时 Exception Filter 兜底。
  - 职能边界：Middleware 做通用横切（日志、CORS）；Guard 做认证鉴权且可提前终止请求；Interceptor 包裹成功响应，适合缓存、超时、响应改写；Pipe 校验转换参数（ValidationPipe + DTO）；Filter 统一异常到响应结构。
  - 拆分策略：按业务域（用户/订单/支付）垂直拆分 Feature Module；跨域复用逻辑下沉 Shared Module，仅通过 exports 暴露；基础设施（配置、数据库连接）用 @Global() 全局模块但保持克制，避免隐式依赖泛滥。
  - 依赖治理：模块间只 import 对方 exports 的能力，保持单向依赖避免循环引用；更复杂的场景再用 CQRS 或微服务（Transporter）演进，而不是一开始就上。

### NODE-A2｜Node 服务性能优化的系统性方案

- **题型**：实际场景应用题
- **难度**：Advanced ★★★★☆
- **问题描述**：
  场景约束：一个 Node API 服务上线后出现三个问题：① 内存持续上涨，疑似泄漏；② 大文件导出接口内存飙升；③ 上游接口偶发抖动时整个服务被拖垮（雪崩）。请给出一套系统性优化方案，覆盖：heap snapshot 排查内存泄漏、Buffer/字符串的内存优化、p-limit 限流与队列削峰、cluster 多进程利用多核、stream 处理大文件。
- **考察要点**：
  - 内存泄漏的常见根因与 heap snapshot 对比分析方法
  - Buffer 属于 V8 堆外内存的特性与池化策略
  - 并发限流、队列削峰的工程落地方式
  - cluster 与 stream 的适用场景及注意点
- **参考答案要点**：
  - 泄漏排查：压测复现 → 定时抓取多份 heap snapshot → Chrome DevTools 的 Comparison 视图对比增量对象（闭包、定时器、事件监听、无界 Map/缓存）；同时监控 `process.memoryUsage()` 的 heapUsed/rss 趋势曲线。
  - 常见根因与修复：全局缓存无淘汰改用 LRU；忘清理的 setInterval / 重复 addEventListener 及时销毁；闭包长期持有大对象要显式置空。
  - Buffer 属于 V8 堆外内存，由 8KB 分界的 Slab 池管理：频繁分配可用 `Buffer.allocUnsafe` + copy 或对象池复用；超长字符串拼接改用流或分块，避免单帧大字符串撑爆堆。
  - 异步限流：p-limit 控制并发上限，失败重试加指数退避；削峰用 BullMQ/Redis 队列把瞬时流量转为固定速率消费的异步任务，并配置死信队列兜底。
  - cluster 按核数 fork 子进程共享端口，配合 PM2 或容器多副本部署；会话等共享状态必须外置（Redis），master 只做调度不做业务。
  - 大文件导出用 `pipeline(readStream, transform, res)` 边读边写、内存恒定，配合 gzip 流压缩；务必监听 error 并 destroy，防止文件描述符泄漏。

### NODE-A3｜前端构建工具核心功能设计

- **题型**：架构设计题
- **难度**：Advanced ★★★★★
- **问题描述**：
  设计一个面向前端的构建工具（对标 Vite / esbuild / Rollup 的核心子集），要求覆盖：依赖扫描与预构建、模块图与 AST 转换管线、插件体系设计、HMR 原理。请给出核心流程、关键数据结构与关键设计点。
- **考察要点**：
  - 从入口到产物的完整构建流程与核心数据结构（模块图）
  - 依赖与源码的区别对待（预构建 vs 按需加载）
  - 插件钩子体系的设计与排序规则
  - HMR 的模块更新边界与服务端/客户端协作机制
- **参考答案要点**：
  - 核心流程：入口 → 依赖扫描（解析 import 构建 ModuleGraph）→ 转换管线（parse 成 AST → 逐插件 transform → generate 代码与 sourcemap）→ chunk 拆分与输出。
  - 依赖扫描：识别裸模块导入（bare import）区分 node_modules 依赖与业务源码；依赖用 esbuild 预构建成单文件 ESM（CJS 转 ESM、合并小模块减少请求），源码在 dev 下走浏览器原生 ESM 按需加载、不打包。
  - AST 转换：用 acorn/babel parser parse → traverse 修改节点（JSX/TS 转换、import 重写为 URL）→ generate 并生成 sourcemap；管线以"字符串进、字符串出"的 transform 钩子串联，结果以文件内容 hash 为 key 缓存。
  - 插件体系：借鉴 Rollup 钩子（resolveId/load/transform/renderChunk，分构建与输出两阶段），由插件容器按序调用并支持返回 Promise；钩子返回 null 表示跳过，用 enforce: 'pre'/'post' 控制顺序，兼容 Rollup/Vite 插件生态可大幅降低接入成本。
  - HMR 原理：dev server 监听文件变化 → 以模块 URL 为标识，沿模块图向上寻找"接受更新的边界"（`import.meta.hot.accept` 声明）→ 通过 WebSocket 推送更新消息 → 客户端重新 import 新模块并执行 accept 回调；CSS/组件热替换，找不到边界则整页刷新。
  - 关键设计点：性能上用 esbuild/SWC 等原生工具做解析与压缩、持久化文件缓存、任务并行化；正确性上保证解析语义与 Node 一致（alias、export conditions），sourcemap 链路完整可回溯。

---

## 📌 本领域高频考点速记

- 事件循环：同步代码 → 微任务（process.nextTick 优先于 Promise）→ 各阶段宏任务；主线程被 CPU 密集任务阻塞是一切卡顿的根源。
- fs 三板斧：小文件 readFile、启动期配置 readFileSync、大文件 createReadStream（背压交给 pipeline 兜底）。
- CJS 值拷贝 vs ESM 实时绑定；.mjs/.cjs 与 package.json 的 type 字段决定模块格式。
- Koa 洋葱模型：错误中间件必须第一个注册（最外层）；Express 靠四参错误中间件捕获异常。
- Promise.all 快速失败 / allSettled 全量结果 / race 超时竞速；先创建 Promise 再 await 才是并发。
- Stream + pipeline 处理大文件内存恒定；漏掉 error 监听会文件描述符泄漏。
- 内存泄漏排查：多份 heap snapshot 对比增量 + 监控 heapUsed；无界缓存改 LRU。
- p-limit 限流 + 消息队列削峰防雪崩；cluster/PM2 多进程利用多核，共享状态外置 Redis。
- Nest.js 请求生命周期：Middleware → Guard → Interceptor → Pipe → Controller → Exception Filter。
- 脚手架三件套：commander 命令解析、inquirer 交互问答、模板下载 + 变量替换。
