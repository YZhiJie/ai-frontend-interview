# EP.04 SSE 流式输出

> 对应正文：[docs/04-ai-development.md](../docs/04-ai-development.md)（AI-B2 流式输出与首字延迟 / AI-B3 SSE 基本原理 / AI-I1 SSE vs WebSocket 选型 / AI-I2 fetch + ReadableStream 手写 SSE 解析）· 配套示例：`../examples/04-ai/server.mjs`、`../examples/04-ai/public/chat.html`、`../examples/04-ai/public/image.html`

## 剧情回顾

- **第 1 格**：小研吐槽 AI 回答要干等十几秒、一整段才蹦出来；码叔点题——用户要的不是更快，是「立刻有反应」。
- **第 2 格**：码叔介绍 SSE：一条不关門的 HTTP，服务端持续写 `text/event-stream` 文本帧，浏览器原生解析还管断线重连。
- **第 3 格**：小研手搓打字机：fetch reader 循环读取，`TextDecoder` 的 stream 模式加缓冲区切帧，逐字追加到气泡。
- **第 4 格**：结案——单向推送 SSE 就够；协同编辑、通话这类双向实时场景才上 WebSocket。

## 知识点拆解

### 第 1 格 · 等待生成的时间

```js
const all = await res.text();
// 生成 15s，用户干等 15s；首字延迟 = 全文生成完
```

- 非流式请求要等整个响应结束才能拿到文本，首字延迟（TTFT）约等于全文生成时间；
- 流式输出把等待压缩到首个 token 到达，并形成打字机效果，是长文本生成的体验底线（AI-B2）；
- 优化的是**感知**：总时长未必变短，但界面立刻有反馈。

### 第 2 格 · SSE 数据流

- SSE 的本质是基于普通 HTTP 的**单向服务器推送**：响应头 `Content-Type: text/event-stream`，连接保持不断，服务端持续写符合事件流格式的文本；
- 报文以行为单位：`data:` 消息负载、`event:` 自定义事件名（缺省 message）、`id:` 事件编号、`retry:` 重连间隔；冒号开头是注释（常用作心跳），**空行表示一帧结束**；
- 浏览器用 EventSource 订阅，断开后按 retry 自动重连，并自动带上 `Last-Event-ID` 请求头（值为最后收到的 id），服务端据此断点续传；
- 限制：仅服务端 → 客户端单向、仅 UTF-8 文本；原生 EventSource 不支持 POST 与自定义鉴权头，这类场景要用 fetch 手动解析（AI-B3）。

### 第 3 格 · 手搓打字机

```js
const res = await fetch(url);
const reader = res.body.getReader();
const dec = new TextDecoder();
let buf = '';
while (true) {
  const { value } = await reader.read();
  buf += dec.decode(value, { stream: true });
  // 按行切 data: 帧，残帧留在 buf，完整帧追加到气泡上屏
}
```

- `decode(value, { stream: true })` 是关键：一个汉字可能被网络分包切成两半，stream 模式在 decoder 内部留住多字节残片，不乱码；
- 必须维护跨 chunk 缓冲区：没有换行结尾的半行留给下一个 chunk 拼接，不能对每个 chunk 直接 `split('\n')`；
- 收到 `[DONE]` 要终止整个读取循环（return，而非只 break 内层循环）；非 JSON 的心跳行用 try-catch 跳过；
- 「停止生成」用 AbortController 传 `signal`，catch 中按 `error.name === 'AbortError'` 区分用户中断与网络错误（AI-I2）。

### 第 4 格 · 单向就够用

- AI 聊天下行是流式文本、上行就是普通 POST 提问，且要过网关鉴权——SSE 复用 HTTP 生态、CDN/代理友好，全面占优；
- WebSocket 是 101 Upgrade 后的独立全双工协议，重连、心跳、消息补偿都要自己实现，留给协同编辑、音通话等双向高频场景（AI-I1）；
- 零依赖的完整实现可跑 `node ../examples/04-ai/server.mjs`，配合 `public/chat.html` 看逐帧打字效果。

## 坑点清单

1. **Content-Type 不对会整段下载**：少了 `text/event-stream`（或被 Nginx 等代理缓冲），浏览器就不把响应当流解析，表现为憋到最后一次性出现，记得 `Cache-Control: no-cache` 与 `X-Accel-Buffering: no`；
2. **SSE 只能服务端单向推**：要双向实时（协同编辑 / 通话）再上 WebSocket；行情推送这类纯下行用 SSE 反而省心；
3. 手写解析两必做：`decode(value, { stream: true })` 防中文乱码、缓冲区拼接防跨 chunk 半帧，否则高频 token 下必现乱码与 JSON.parse 报错。

## 自测 3 题（含答案）

1. SSE 一帧的边界怎么表示？断线续传靠什么？——**空行表示一帧结束；浏览器自动重连时携带 Last-Event-ID 请求头（值为最后收到的 id:），服务端据此从断点续传**。
2. 手写 SSE 解析时 `TextDecoder` 为什么要传 `{ stream: true }`？——**中文等多字节字符可能被 chunk 截断，stream 模式会在 decoder 内部保留残字节，与下一 chunk 拼齐后再解码，避免半个汉字乱码**。
3. AI 聊天流式回复选 SSE 还是 WebSocket？——**选 SSE：下行是单向流式文本、上行用普通 POST 提问，SSE 复用 HTTP 生态、自带重连且对网关 CDN 友好；只有协同编辑、通话等双向高频场景才需要 WebSocket**。
