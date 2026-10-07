# C1 答案册｜AI 生成的流式聊天组件（对应 AI-I4）

> 面试时本文件与 `solutions/` 不应提前发给候选人。复现命令：
> `npx tsx 04-ai-review-dojo/repro/c1-repro.ts`（在 `examples/` 目录下）

## 雷点分级清单

| # | 级别 | 问题 | 证据 / 复现 | 修法要点 |
|---|------|------|------------|---------|
| 1 | blocker | `dangerouslySetInnerHTML` 直接渲染 LLM 输出 | 模型可输出 `<img src=x onerror=...>`，构成存储型 XSS | 纯文本渲染；需要富文本时走白名单 sanitizer，代码块先转义再着色 |
| 2 | blocker | 无跨 chunk 缓冲区，逐 chunk `split('\n\n')` | 本道场穷举 110 个字节切点，雷版在 44 个切点静默丢帧 | 维护 `buf`，按 `\n\n` 切帧、尾部留存（见 `solutions/c1-fixed-stream.ts`） |
| 3 | blocker | 每个 delta push 一条新气泡 | 整包到达即产出「你」「好」两条碎片，长回复会产生几十条气泡 | delta 累加到同一条 current，流结束产生一条 assistant 消息 |
| 4 | major | `decoder.decode(value)` 未传 `{ stream: true }` | 切点落在 3 字节汉字中间时整帧被吞（错误不可观测） | `decode(value, { stream: true })`，不完整序列留解码器内部缓冲 |
| 5 | major | 会话切换竞态 | 快速切会话时旧历史/旧流覆盖新会话 | 请求序号丢弃 stale 响应，或 AbortController 随会话切换中止 |
| 6 | major | 无中断/卸载清理、非 200 响应当流解析 | 离开页面后 setState；限流 JSON 被逐帧 parse 抛错 | abort + 卸载标志；先判 `res.ok`，错误体走错误分支并分类提示 |
| 7 | major | `[DONE]` 只 `break` 内层 for | 道场在 `[DONE]` 后塞一帧，雷版照样解析（泄漏帧） | finished 标志终止整个读取过程 |
| 8 | nit | `conv` 未 encode、多行 `data:` 未拼接、无合帧 | — | `encodeURIComponent`；按 SSE 规范拼接多行 data；高频 token rAF 合帧 |

## 假疑点（应放行，考察审查克制力）

`res.body!` 在该组件为纯客户端渲染、现代浏览器 + fetch 流式环境下成立，**不是问题**。
候选人若在此刷评论，说明其在"表现勤奋"而非评估真实风险。

## 合入决策

**request changes**。存在可直接构造的 XSS（#1）与必现的流式错误（#2/#3/#7），
且零测试——"CI 全绿"只说明 happy path 能编译通过。

## 防复发（比修代码更重要）

- 把"任意字节切点不变性"固化为回归测试：本道场 C1 的穷举切点 + 随机分包就是可直接搬进 CI 的形态；
- ESLint 规则禁止在聊天渲染路径出现 `dangerouslySetInnerHTML`（`no-restricted-properties` + 路径豁免清单）；
- 审查清单条目化：「流式 PR 必须含分包测试」「模型输出渲染必须过 sanitizer」。
