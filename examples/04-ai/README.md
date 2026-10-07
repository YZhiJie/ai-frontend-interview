# 04 · AI 应用开发 —— 可运行示例（MOCK，零 npm 依赖）

纯 `node:http` 实现，**不需要 API Key、不需要 npm install**，Node ≥ 18（内置 fetch / ReadableStream）即可运行。

## 启动

```bash
node server.mjs
# [04-ai] Mock 服务已启动：http://127.0.0.1:3401
```

## curl 验证

```bash
# 1) SSE 流式聊天：-N 关闭缓冲，可看到 data: 帧逐行到达，末尾 data: [DONE]
curl -s -N "http://127.0.0.1:3401/api/chat?prompt=你好" --max-time 4

# 2) 提交文生图任务，立即拿到 jobId
curl -s -X POST http://127.0.0.1:3401/api/image \
  -H 'Content-Type: application/json' -d '{"prompt":"赛博朋克城市夜景"}'
# {"code":0,"data":{"jobId":"xxxxxxxx-...."}}

# 3) 轮询进度（约 3 秒：queued → running 30~100% → done，done 时带 dataUrl）
curl -s "http://127.0.0.1:3401/api/image/status?id=<上一步的jobId>"

# 4) 模拟失败：prompt 含“失败”二字 → 任务在 running 阶段返回 500
curl -s -X POST http://127.0.0.1:3401/api/image \
  -H 'Content-Type: application/json' -d '{"prompt":"一张失败的图"}'
```

## 浏览器操作步骤

打开 http://127.0.0.1:3401/

1. **SSE 流式聊天**（`/chat.html`）：输入问题 → 发送，观察「连接中 → 生成中 → 已完成」状态与打字机效果；生成过程中点「停止生成」，服务端日志会打印「客户端断开连接，已停止生成」（`req.on('close')` 清理定时器）。
2. **文生图**（`/image.html`）：输入 prompt → 生成图片，观察排队骨架、分阶段进度条与最终成图；点「模拟一次失败」看到失败卡片，再点「重试」会带 `retry:true` 提交新任务并成功。

## 文件 → 题号映射

| 文件 | 对应考点 | 覆盖机制 |
| --- | --- | --- |
| `server.mjs`（/api/chat） | AI-B3、AI-I2 | SSE 响应头、`data:` 帧协议、40ms 逐帧、`[DONE]` 结束标记、`req.on('close')` 断线清理 |
| `public/chat.html` | AI-I2、AI-A1 | `getReader()` + `TextDecoder(..., {stream:true})`、按 `\n\n` 切帧并保留半包、`[DONE]` 终止循环、`AbortController` 中断、状态机联动、增量 append 文本节点 |
| `server.mjs`（/api/image*） | AI-I3、AI-A2 | 异步任务模式（jobId + 内存任务表）、queued→running→done 状态机、进度轮询、动态 SVG base64 成图、确定性的失败模拟 |
| `public/image.html` | AI-I3、AI-A2 | 提交→轮询（300ms）→展示、固定宽高比骨架防 CLS、分阶段进度、失败卡片 + 重试新任务、`beforeunload` 清理定时器 |
| `public/index.html` | AI-B2 | Mock 与生产的替换点：`LLM_BASE_URL` 环境变量、后端代理隐藏 Key、Redis 任务表、CDN URL |

## 考点说明

- **AI-B3 SSE 原理**：SSE 本质是「保持不断的 HTTP 长响应 + 分块文本协议」，响应头 `Content-Type: text/event-stream`；事件以空行 `\n\n` 分隔，`data:` 为负载，`:` 开头为注释/心跳。服务端还设置了 `X-Accel-Buffering: no`，避免 Nginx 缓冲导致帧不实时下发。
- **AI-I2 手写解析的四个坑**（本 demo 全部正确处理）：
  1. `decode(value)` 必须传 `{ stream: true }`，否则跨 chunk 的半个汉字变乱码；
  2. 必须维护缓冲区按 `\n\n` 切帧，最后一段半包留到下一 chunk；
  3. 收到 `[DONE]` 要终止整个读取循环（`return`），`break` 只跳出内层 for；
  4. `JSON.parse` 要 try-catch，心跳/注释帧不应打断整条流。
- **AI-I3 异步任务**：长耗时生成不能用一条长 HTTP 请求硬等（易被网关超时切断且无法展示进度），而是立即返回 jobId，前端轮询或订阅 SSE；轮询节奏生产环境建议 1s 起步 + 指数退避 + 次数上限。
- **AI-A2 体验要点**：任务卡常驻、骨架屏锁定宽高比防 CLS、失败按类型提示并一键重试、离开页面清理定时器；多任务并发还需任务队列（并发上限 2~3）与服务端事实源。

### SSE vs WebSocket 选型（文字版，对应 AI-I1）

| 维度 | SSE | WebSocket |
| --- | --- | --- |
| 协议基础 | 普通 HTTP 长响应（`text/event-stream`），复用 HTTP 生态 | HTTP `101 Upgrade` 后的独立全双工协议 |
| 通信方向 | 单向（服务器 → 客户端），上行另开普通请求 | 全双工，一条连接双向收发 |
| 断线重连 | EventSource 原生自动重连 + `Last-Event-ID` 断点续传 | 重连、心跳、消息补偿全部自己实现 |
| 数据格式 | 仅 UTF-8 文本（二进制要 base64，膨胀约 33%） | 原生支持二进制帧 |
| 基础设施 | 对代理/网关/CDN/负载均衡最友好（关掉缓冲即可） | 需支持 Upgrade 与长连接保持、sticky 会话 |
| 鉴权 | fetch 版可用标准 Cookie/Header；原生 EventSource 不支持自定义头 | Cookie、URL token 或首帧认证，相对别扭 |
| 典型场景 | **AI 聊天流式回复、行情/通知推送** | **多人协同编辑、聊天室等双向高频通信** |

结论：AI 聊天是「下行流式 + 上行普通 POST」，SSE 全面占优；协同编辑必须 WebSocket。
