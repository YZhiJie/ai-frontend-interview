/**
 * NODE-I1｜基于 Koa 的规范化 RESTful API（端口 3403）
 *
 * 启动（先装依赖）：
 *   pnpm install --registry=https://registry.npmmirror.com
 *   node server.mjs
 *
 * curl 验证：
 *   curl -s http://127.0.0.1:3403/api/users
 *   curl -s http://127.0.0.1:3403/api/users/1
 *   curl -s -i http://127.0.0.1:3403/api/users/999   # 业务错误 → 404 JSON，进程不崩
 *   curl -s -i http://127.0.0.1:3403/nope           # 404 JSON
 *
 * Koa 洋葱模型：中间件按注册顺序嵌套，await next() 之前是「进入」阶段，
 * 之后是「返回」阶段。所以全局错误中间件必须第一个注册（最外层）才能兜住内层异常。
 */

import Koa from 'koa';
import Router from '@koa/router';

const app = new Koa();
const router = new Router();

// 内存 Mock 数据（真实项目是数据库）
const users = [
  { id: 1, username: 'alice', role: 'admin' },
  { id: 2, username: 'bob', role: 'member' },
  { id: 3, username: 'charlie', role: 'member' },
];

// 业务错误：携带 HTTP 状态码，错误中间件据此决定对外文案
class BizError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ---------- 中间件 1（洋葱最外层）：全局错误兜底 ---------- */
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    // ctx.throw(4xx) 与 BizError 都带 status；未知错误统一 500 且不暴露堆栈
    const status = err.status || 500;
    const message = status >= 500 ? 'Internal Server Error' : err.message;
    ctx.status = status;
    ctx.body = { code: 1, message, data: null };
    if (status >= 500) console.error('[错误中间件] 未知异常：', err);
  }
});

/* ---------- 中间件 2：洋葱模型日志 + 耗时统计（进入/返回都执行） ---------- */
app.use(async (ctx, next) => {
  const start = Date.now();
  console.log(`[洋葱] → 进入 logger：${ctx.method} ${ctx.url}`);
  await next(); // ← 把控制权交给更内层中间件；内层全部完成后才继续往下
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
  console.log(`[洋葱] ← 离开 logger：${ctx.method} ${ctx.url} ${ctx.status} ${ms}ms`);
});

/* ---------- 中间件 3：再包一层，配合日志直观展示嵌套进出顺序 ---------- */
app.use(async (ctx, next) => {
  console.log('[洋葱]   → 进入 wrapper');
  await next();
  console.log('[洋葱]   ← 离开 wrapper');
});

/* ---------- 统一响应助手：成功统一为 { code:0, message:'ok', data } ---------- */
app.context.ok = function ok(data) {
  this.status = 200;
  this.body = { code: 0, message: 'ok', data };
};

/* ---------- 路由层：只做参数接收与业务调用，不手写响应壳 ---------- */

// GET /api/users —— 用户列表
router.get('/api/users', (ctx) => {
  console.log('[洋葱]     · 路由处理：用户列表');
  ctx.ok(users);
});

// GET /api/users/:id —— 用户详情；不存在抛业务错误，被最外层中间件兜底成 JSON
router.get('/api/users/:id', (ctx) => {
  const id = Number(ctx.params.id);
  console.log(`[洋葱]     · 路由处理：用户详情 id=${id}`);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BizError(400, '非法的用户 id');
  }
  const user = users.find((u) => u.id === id);
  if (!user) {
    // 业务错误：错误中间件兜底，进程不崩、返回结构化 JSON
    throw new BizError(404, `用户 ${id} 不存在`);
  }
  ctx.ok(user);
});

app.use(router.routes());
app.use(router.allowedMethods());

// 404 兜底（未命中任何路由，也要返回统一 JSON 而非 Koa 默认文本）
app.use((ctx) => {
  ctx.status = 404;
  ctx.body = { code: 1, message: `Not Found: ${ctx.method} ${ctx.url}`, data: null };
});

const PORT = 3403;
app.listen(PORT, () => {
  console.log(`NODE-I1 Koa API 已启动：http://127.0.0.1:${PORT}`);
  console.log('  GET /api/users        用户列表');
  console.log('  GET /api/users/:id    用户详情（999 演示业务错误兜底）');
});
