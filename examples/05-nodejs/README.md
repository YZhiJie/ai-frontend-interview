# 05 · Node.js 开发能力 —— 可运行示例

环境：Node v24.17.0、pnpm 11.10.0。分两部分：**零依赖脚本**（`node` 直接跑）与 **Koa 子工程**（需 `pnpm install`）。

## 文件 → 题号映射

| 文件/目录 | 题号 | 说明 |
| --- | --- | --- |
| `b1-fs-path.mjs` | NODE-B1 | `path.join/resolve/extname` 打印 + 20MB 文件「readFileSync vs createReadStream+pipeline」内存对比（rss/heapUsed/external），自动清理临时文件 |
| `b2-http-server.mjs` | NODE-B2 | 纯 `node:http` 最小服务：`/api/time`、`/healthz`、404 JSON、405；端口 **3402** |
| `modules/` | NODE-B3 | CJS（`.cjs`）与 ESM（`.mjs`）计数器对照，实跑打印「值拷贝 vs 实时绑定」 |
| `i2-async-patterns.mjs` | NODE-I2 | 回调地狱 → Promise 链 → async/await；`all/allSettled/race` 与并发/串行时间线 |
| `i1-koa-api/` | NODE-I1 | Koa 子工程：洋葱模型日志、统一 `{code,message,data}`、全局错误兜底、404；端口 **3403** |
| `i3-mini-scaffold/minico.mjs` | NODE-I3 | 零依赖迷你脚手架：readline 问答（项目名 + basic/api 模板）→ 生成 package.json + 入口 |

---

## 一、零依赖脚本（node 直接跑）

### 1. NODE-B1：fs 与 path

```bash
node b1-fs-path.mjs            # 可运行；不开 GC 时数字有噪声
node --expose-gc b1-fs-path.mjs # 推荐：每步强制 GC，内存对比最干净
```

实测要点（20MB 文件）：
- `readFileSync` 持有数据期间 **external 内存 +20MB**（Buffer 在 V8 堆外），释放引用并 GC 后回落到 0；
- `createReadStream + pipeline` 复制完成后 **external/heapUsed 增量 ≈ 0**（只有 64KB 级 chunk 流转）；
- RSS 在 macOS 上因 malloc 页不及时归还 OS 而只增不减，所以**活动内存看 external/heapUsed，不看 RSS 绝对值**；
- 临时文件写在 `os.tmpdir()`，脚本结束自动删除。

### 2. NODE-B2：最小 HTTP 服务

```bash
node b2-http-server.mjs        # 监听 3402
```

另开终端：

```bash
curl -s http://127.0.0.1:3402/api/time                 # {"code":0,"data":{"time":...}}
curl -s http://127.0.0.1:3402/healthz                  # {"code":0,"data":{"status":"ok"}}
curl -s -i http://127.0.0.1:3402/whatever              # 404 JSON
curl -s -X POST http://127.0.0.1:3402/api/time         # 405 JSON
```

### 3. NODE-B3：CommonJS vs ESM

模块格式判定：`.mjs` 恒为 ESM、`.cjs` 恒为 CommonJS；`.js` 取决于最近 `package.json` 的 `"type"`（`"module"` 为 ESM，缺省 commonjs）。

```bash
node modules/cjs-consumer.cjs   # CJS：inc() 三次后，导出的 count 仍是 0（值拷贝），getCount() 为 3
node modules/esm-consumer.mjs   # ESM：inc() 三次后，import 的 count 直接读到 3（实时绑定）
```

### 4. NODE-I2：三代异步模式与并发组合

```bash
node i2-async-patterns.mjs
```

时间线会打印：回调三层嵌套（304ms）→ Promise 链 → async/await；以及
`Promise.all` 在 50ms 处 fail-fast、`allSettled` 等满 151ms 且顺序不变、`race` 最快者胜出与超时竞速、
并发 3 请求 ≈101ms vs 循环内逐个 await ≈303ms。

### 5. NODE-I3：迷你脚手架 minico

```bash
# 交互式
node i3-mini-scaffold/minico.mjs /tmp/minico-demo

# 管道喂输入（CI 友好；实测命令）
printf 'demo-app\nbasic\n' | node i3-mini-scaffold/minico.mjs /tmp/minico-demo
node /tmp/minico-demo/index.mjs 世界      # 你好，世界！

# api 模板生成的是一个 http 服务
printf 'my-api\napi\n' | node i3-mini-scaffold/minico.mjs /tmp/minico-api
node /tmp/minico-api/index.mjs & curl -s http://127.0.0.1:3000/ ; kill %1
```

行为约定：目标目录已存在且非空 → 拒绝创建（退出码 1，不覆盖）；无参数打印用法（退出码 1）；
管道 EOF 时项目名回落为目录名、模板回落为 basic。

---

## 二、Koa 子工程（依赖已由 workspace 统一安装）

```bash
# 在 examples/ 根目录执行一次即可（本工程是 examples pnpm workspace 成员）：
pnpm install --registry=https://registry.npmmirror.com

# 启动服务
cd i1-koa-api
node server.mjs             # 监听 3403
```

curl 验证：

```bash
curl -s http://127.0.0.1:3403/api/users          # 200：{code:0,data:[...]} 统一包装
curl -s http://127.0.0.1:3403/api/users/1        # 200：单个用户
curl -s -i http://127.0.0.1:3403/api/users/999   # 404：业务错误被兜底成 JSON，进程不崩
curl -s http://127.0.0.1:3403/api/users/abc      # 400：非法 id
curl -s -i http://127.0.0.1:3403/nope            # 404：统一 JSON
```

服务端洋葱日志（注册顺序：错误兜底 → logger → wrapper → 路由）：

```
[洋葱] → 进入 logger：GET /api/users/1
[洋葱]   → 进入 wrapper
[洋葱]     · 路由处理：用户详情 id=1
[洋葱]   ← 离开 wrapper
[洋葱] ← 离开 logger：GET /api/users/1 200 0ms
```

要点：错误中间件必须**第一个注册**（洋葱最外层）才能兜住内层 `throw`；
业务错误带 `err.status`（4xx）对外透传 message，未知错误统一 500 且隐藏堆栈。
依赖版本实测：koa 2.16.4、@koa/router 13.1.0。
