/**
 * 04-ai 零依赖 Mock 服务器（纯 node:http，无需 npm install）
 * 对应考点：AI-B3（SSE 原理）/ AI-I2（流式分帧）/ AI-I3（异步任务+轮询）/ AI-A2（失败重试）
 *
 * 启动：node server.mjs
 *
 * curl 验证命令：
 *   # 1) SSE 流式聊天（-N 关闭 curl 缓冲，可看到逐帧到达）
 *   curl -s -N "http://127.0.0.1:3401/api/chat?prompt=你好" --max-time 4
 *
 *   # 2) 文生图：提交任务
 *   curl -s -X POST http://127.0.0.1:3401/api/image \
 *     -H 'Content-Type: application/json' -d '{"prompt":"赛博朋克城市夜景"}'
 *
 *   # 3) 文生图：轮询进度（把 JOB_ID 换成上一步返回的 jobId）
 *   curl -s "http://127.0.0.1:3401/api/image/status?id=JOB_ID"
 *
 *   # 4) 模拟失败（prompt 含“失败”二字，任务在 running 阶段返回 500）
 *   curl -s -X POST http://127.0.0.1:3401/api/image \
 *     -H 'Content-Type: application/json' -d '{"prompt":"一张失败的图"}'
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = 3401;

/* ------------------------------------------------------------------ */
/* 一、SSE 流式聊天（对应 AI-B3 / AI-I2）                                */
/* ------------------------------------------------------------------ */

// 固定中文 Mock 回答（约 80 字）。真实项目中这里是转发 LLM 的逐 token 输出
const MOCK_ANSWER =
  '你好！我是用 MOCK 数据模拟的 AI 助手。真实项目中，这段文字会由后端代理转发给大模型，' +
  '通过 SSE 逐字流式返回；API Key 只保存在服务端，前端只负责增量渲染、中断与重试。';

function handleChat(req, res, url) {
  const prompt = url.searchParams.get('prompt') || '';

  // SSE 三件套响应头：text/event-stream + 不缓存 + 长连接
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    // 告诉 Nginx 等反向代理不要缓冲本响应（生产环境常见坑）
    'X-Accel-Buffering': 'no',
  });

  // 先把用户问题作为一帧推给前端（真实场景通常由前端自行渲染）
  res.write(`: connected, prompt=${prompt.length} chars\n\n`);

  // 把固定回答按 2~3 个字切帧
  const frames = [];
  let i = 0;
  while (i < MOCK_ANSWER.length) {
    const size = 2 + Math.floor(Math.random() * 2); // 2 或 3
    frames.push(MOCK_ANSWER.slice(i, i + size));
    i += size;
  }

  let frameIndex = 0;
  let closed = false;

  const timer = setInterval(() => {
    if (closed) return;
    if (frameIndex >= frames.length) {
      // 结束标记：前端识别 [DONE] 后终止整个读取循环
      res.write('data: [DONE]\n\n');
      cleanup();
      res.end();
      return;
    }
    // delta 内容用 JSON 转义，前端 JSON.parse 即可（中文直接输出也合法）
    const payload = JSON.stringify({ delta: frames[frameIndex] });
    res.write(`data: ${payload}\n\n`);
    frameIndex += 1;
  }, 40);

  // 断线处理：浏览器关闭/AbortController 中断会触发 req 的 close 事件
  // 必须清理定时器，否则任务在后台空跑并继续写一个已关闭的 socket
  function cleanup() {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    req.off('close', onClose);
  }
  function onClose() {
    if (!res.writableEnded) {
      console.log(`[chat] 客户端断开连接，已停止生成（prompt=${prompt.slice(0, 20)}）`);
      cleanup();
      res.destroy();
    }
  }
  req.on('close', onClose);
}

/* ------------------------------------------------------------------ */
/* 二、文生图异步任务（对应 AI-I3 / AI-A2）                              */
/* ------------------------------------------------------------------ */

// 内存任务表：生产环境应放 Redis/DB，服务重启不丢任务
const imageJobs = new Map();

const QUEUE_MS = 600; // queued 排队阶段时长
const RUN_MS = 2400; // running 生成阶段时长（总耗时约 3 秒）
const FAIL_AT_MS = 1100; // 模拟失败在 running 阶段 1.1s 时发生

function handleCreateImage(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy(); // 简单的请求体大小保护
  });
  req.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(body || '{}');
    } catch {
      return sendJson(res, 400, { code: 1, message: '请求体不是合法 JSON' });
    }

    const prompt = String(payload.prompt || '').trim();
    if (!prompt) {
      return sendJson(res, 400, { code: 1, message: 'prompt 不能为空' });
    }

    // 演示约定：prompt 含“失败”二字 → 任务在生成阶段失败；
    // 前端点击“重试”时带 retry:true，服务端改为正常完成（模拟可重试错误恢复）
    const willFail = prompt.includes('失败') && payload.retry !== true;

    const jobId = crypto.randomUUID();
    imageJobs.set(jobId, {
      id: jobId,
      prompt,
      status: 'queued', // queued → running → done / failed
      progress: 0,
      createdAt: Date.now(),
      willFail,
      dataUrl: null,
    });

    console.log(`[image] 任务已创建 ${jobId} willFail=${willFail} prompt=${prompt.slice(0, 20)}`);
    sendJson(res, 200, { code: 0, data: { jobId } });
  });
}

// 根据经过时间惰性计算任务状态（不依赖定时器，轮询时算一次即可）
function refreshJob(job) {
  if (job.status === 'done' || job.status === 'failed') return;
  const elapsed = Date.now() - job.createdAt;

  if (elapsed < QUEUE_MS) {
    job.status = 'queued';
    job.progress = 0;
    return;
  }

  job.status = 'running';
  if (job.willFail && elapsed >= QUEUE_MS + FAIL_AT_MS) {
    job.status = 'failed';
    job.progress = 45;
    return;
  }

  // running: 30% → 100% 线性增长
  const pct = 30 + Math.min(1, (elapsed - QUEUE_MS) / RUN_MS) * 70;
  job.progress = Math.floor(pct);

  if (elapsed >= QUEUE_MS + RUN_MS) {
    job.status = 'done';
    job.progress = 100;
    job.dataUrl = buildSvgDataUrl(job.prompt);
  }
}

function handleImageStatus(req, res, url) {
  const id = url.searchParams.get('id') || '';
  const job = imageJobs.get(id);
  if (!job) {
    return sendJson(res, 404, { code: 1, message: '任务不存在' });
  }

  refreshJob(job);

  if (job.status === 'failed') {
    // 失败时以 5xx 返回，前端 fetch 进入 catch/ok===false 分支展示失败卡片
    return sendJson(res, 500, {
      code: 1,
      message: '生成失败（模拟）：服务繁忙，请稍后重试',
      data: { status: job.status, progress: job.progress },
    });
  }

  sendJson(res, 200, {
    code: 0,
    data: {
      status: job.status,
      progress: job.progress,
      ...(job.dataUrl ? { dataUrl: job.dataUrl } : {}),
    },
  });
}

// 动态生成一张简单 SVG（写上 prompt 前 10 个字），base64 后作为 data URL 返回
function buildSvgDataUrl(prompt) {
  const label = prompt.slice(0, 10);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="24" fill="url(#g)"/>
  <circle cx="120" cy="110" r="70" fill="#ffffff" opacity="0.12"/>
  <circle cx="420" cy="400" r="110" fill="#ffffff" opacity="0.10"/>
  <text x="256" y="246" font-size="34" fill="#ffffff" text-anchor="middle"
        font-family="PingFang SC, Microsoft YaHei, sans-serif" font-weight="bold">${escapeXml(label)}</text>
  <text x="256" y="300" font-size="20" fill="#ffffff" opacity="0.75" text-anchor="middle"
        font-family="PingFang SC, Microsoft YaHei, sans-serif">Mock 文生图 · 512×512</text>
</svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf-8').toString('base64');
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  );
}

/* ------------------------------------------------------------------ */
/* 三、静态文件托管 + 路由入口                                           */
/* ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  // 防路径穿越：normalize 后结果必须仍在 PUBLIC_DIR 内
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    return sendJson(res, 403, { code: 1, message: 'Forbidden' });
  }

  fs.readFile(filePath, (err, buf) => {
    if (err) {
      return sendJson(res, 404, { code: 1, message: 'Not Found' });
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(buf);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  if (req.method === 'GET' && url.pathname === '/api/chat') {
    return handleChat(req, res, url);
  }
  if (req.method === 'POST' && url.pathname === '/api/image') {
    return handleCreateImage(req, res);
  }
  if (req.method === 'GET' && url.pathname === '/api/image/status') {
    return handleImageStatus(req, res, url);
  }
  if (url.pathname.startsWith('/api/')) {
    return sendJson(res, 404, { code: 1, message: '未知接口' });
  }
  serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`[04-ai] Mock 服务已启动：http://127.0.0.1:${PORT}`);
  console.log(`  - SSE 聊天:    GET  /api/chat?prompt=xxx`);
  console.log(`  - 文生图提交:  POST /api/image`);
  console.log(`  - 文生图轮询:  GET  /api/image/status?id=xxx`);
});
