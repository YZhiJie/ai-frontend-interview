/**
 * NODE-B2｜node:http 最小 Web 服务（零依赖）
 * 运行：node b2-http-server.mjs
 *
 * curl 验证：
 *   curl -s http://127.0.0.1:3402/api/time
 *   curl -s http://127.0.0.1:3402/healthz
 *   curl -s -i http://127.0.0.1:3402/whatever   # 404 JSON
 *
 * 要点：
 *   - req（IncomingMessage）是可读流：method/url/headers 描述请求，POST body 靠 data/end 收集
 *   - res（ServerResponse）是可写流：writeHead 写状态码+头，end 输出响应体（end 后不可再写）
 *   - 返回 JSON 要带 Content-Type: application/json; charset=utf-8
 *   - new URL(req.url, base) 同时拿 pathname/searchParams，比手切字符串稳
 *   - Express/Koa 本质都是对这套 req/res 原语的封装
 */

import http from 'node:http';

const PORT = 3402;

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  if (req.method !== 'GET') {
    return sendJson(res, 405, { code: 1, message: 'Method Not Allowed' });
  }

  if (pathname === '/api/time') {
    // 业务接口：统一 { code, data } 结构
    return sendJson(res, 200, {
      code: 0,
      data: { time: new Date().toISOString(), timestamp: Date.now() },
    });
  }

  if (pathname === '/healthz') {
    // 存活探针：负载均衡/K8s 用它判断实例是否健康
    return sendJson(res, 200, { code: 0, data: { status: 'ok' } });
  }

  // 404 也返回 JSON 而不是默认 HTML，前端拦截器好处理
  sendJson(res, 404, { code: 1, message: 'Not Found', path: pathname });
});

// EADDRINUSE（端口被占用）会走 error 事件，不能让它静默崩掉
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请先释放或换端口`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`NODE-B2 最小 HTTP 服务已启动：http://127.0.0.1:${PORT}`);
  console.log('  GET /api/time  → JSON 时间');
  console.log('  GET /healthz   → 健康检查');
  console.log('  其他路径        → 404 JSON');
});
