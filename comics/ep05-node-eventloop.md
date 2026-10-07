# EP.05 Node 事件循环

> 对应正文：[docs/05-nodejs.md](../docs/05-nodejs.md)（覆盖 NODE-I2 三代异步模式与并发分析 / NODE-B1 fs 读取方式与阻塞 / NODE-I1 Koa 异步中间件）· 配套示例：`../examples/05-nodejs/i2-async-patterns.mjs`、`../examples/05-nodejs/b1-fs-path.mjs`、`../examples/05-nodejs/i1-koa-api/server.mjs`

## 剧情回顾

- **第 1 格**：小研发问——`setImmediate` 和 `setTimeout(fn, 0)` 到底谁先跑？码叔点破：浏览器只有一张宏任务队列，Node 却把一圈循环切成了六个阶段，谜底在 libuv 里。
- **第 2 格**：码叔画出 libuv 六阶段流水线：timers → pending callbacks → poll → check，fs、加密这类重活丢进 libuv 线程池，不堵主线程。
- **第 3 格**：小研实证：同一段代码在主模块里输出顺序不确定，放进 `fs.readFile` 的 IO 回调里就恒定输出 `I T`——因为 IO 回调在 poll 阶段执行，下一站正是 check。
- **第 4 格**：结案两个高频坑：主模块里两者先后不确定；`process.nextTick` 才是真正的插队王，滥用会饿死事件循环。

## 知识点拆解

### 第 1 格 · 0 毫秒也不立即

- `setTimeout(fn, 0)` 的回调注册在 **timers** 阶段，0ms 只是最小阈值，真到 timers 阶段时定时器若没到点照样被跳过；
- `setImmediate(fn)` 的回调注册在 **check** 阶段，语义是"本轮 poll 完就执行"；
- 浏览器只有一张宏任务队列，而 Node 用 libuv 把每圈循环切成固定顺序的多个阶段——行为差异的根源就在这里；
- 同步代码执行期间谁都不能插队，主线程被 CPU 密集任务阻塞是一切卡顿的根源（NODE-B1 因此禁止在请求路径里用 `readFileSync`）。

### 第 2 格 · libuv 六阶段

- 每圈按固定顺序跑：**timers**（`setTimeout`/`setInterval`）→ **pending callbacks**（上一轮漏掉的系统回调）→ **poll**（取 IO 事件，必要时等待新任务）→ **check**（`setImmediate` 的专属舞台），另有 idle/prepare 内部阶段与 close callbacks；
- 每个阶段切换的检查点都会清空微任务，其中 `process.nextTick` 队列优先于 `Promise.then` 回调；
- fs 文件 IO、DNS、加密等重活交给 libuv 线程池（默认 4 个线程），干完后把回调送回 poll 阶段，主线程一刻也不停；
- 与 docs 速记一致：同步代码 → 微任务（nextTick 优先于 Promise）→ 各阶段宏任务。

### 第 3 格 · 输出对比题

```js
const fs = require('fs');

// ① 主模块直接跑
setTimeout(() => console.log('T'));
setImmediate(() => console.log('I'));
// 输出顺序：不确定（T I 或 I T）

// ② 换到 IO 回调里再跑
fs.readFile(__filename, () => {
  setTimeout(() => console.log('T'));
  setImmediate(() => console.log('I'));
});
// 恒定输出：I T
```

- 主模块跑完时，1ms 定时器可能到点也可能没到点，timers 与 check 谁先命中不确定；
- IO 回调本身在 poll 阶段执行，之后固定经过 check：`setImmediate` 当圈必跑，`setTimeout` 只能等下一圈 timers，所以恒定 `I T`；
- 结论：需要稳定顺序，就把调度放进 IO 回调，或显式选用 `setImmediate`；可运行 `node ../examples/05-nodejs/i2-async-patterns.mjs` 对照观察。

### 第 4 格 · nextTick 才是插队王

- `process.nextTick` 不属于六阶段中的任何一个，它的队列在每个阶段切换点最先清空，优先级高于 Promise 微任务；
- 递归或大批量 `nextTick` 会让后续阶段永远拿不到执行权，IO 与 timers 被"饿死"，官方建议多数场景改用 `setImmediate`；
- Koa 的洋葱模型（NODE-I1）能自然包裹异步逻辑，前提正是每个中间件都正确 `await next()`，把控制权交还给事件循环。

## 坑点清单

1. **主模块里 `setTimeout(fn, 0)` 与 `setImmediate` 顺序不确定**：不要写出依赖两者先后的代码，需要确定性就放进 IO 回调，那里 `setImmediate` 恒先；
2. **`process.nextTick` 优先级最高**：它在阶段切换时先于 Promise 清空，递归 nextTick 会饿死事件循环，别拿它当普通延时用；
3. **同步阻塞拖垮整圈循环**：`readFileSync` 只能出现在启动期/CLI 脚本里，请求处理中务必用异步 API 或流（createReadStream）。

## 自测 3 题（含答案）

1. 为什么 IO 回调里 `setImmediate` 恒先于 `setTimeout(fn, 0)`？——**IO 回调在 poll 阶段执行，下一站就是 check，setImmediate 当圈执行，setTimeout 要等下一圈 timers**。
2. `process.nextTick` 和 `Promise.then` 谁先执行？——**nextTick 队列优先于 Promise 微任务，在阶段切换的检查点最先被清空**。
3. libuv 线程池解决了什么问题？——**fs、加密等重活在线程池中执行，完成后回调回到 poll，避免阻塞主线程的事件循环**。
