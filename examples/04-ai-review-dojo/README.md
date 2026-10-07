# AI 代码审查道场 · AI Code Review Dojo

> 对应文档题号：**AI-I4 / AI-A5 / AI-A6**（[docs/04-ai-development.md](../../docs/04-ai-development.md)）
> 训练 2026 年最稀缺的工程能力之一：**审查 AI 生成的代码**——对"看起来合理、CI 全绿、但责任在你"的代码做出分级、决策与防复发设计。

## 面试怎么用

1. 只把 `challenges/` 发给候选人（雷源码 + slop PR diff），要求限时产出：分级意见（blocker / major / nit）、合入决策、给编码 Agent 的返工指令；
2. `answers/`（答案册）与 `solutions/`（修复版）面试时收走，作为评分锚点；
3. 讨论结束后运行复现脚本，让候选人**亲眼看到**缺陷在任意分包/注入 payload 下必现——"证据驱动"本身也是评分项。

## 三个挑战

| 编号 | 挑战 | 给候选人的材料 | 核心考点 |
|------|------|---------------|---------|
| C1 | AI 生成的流式聊天组件 | [challenges/c1-buggy-sse-chat.ts](challenges/c1-buggy-sse-chat.ts) | XSS、SSE 跨 chunk 分帧、多字节截断、delta 消息模型、[DONE] 终止；另有一个假疑点考分级克制力 |
| C2 | Agent 退款工具 | [challenges/c2-buggy-agent-refund.ts](challenges/c2-buggy-agent-refund.ts) | 水平越权、间接 prompt injection（备注藏指令）、SQL 注入、无审批高危工具、缺幂等；要求构造真实攻击链 |
| C3 | 架构 slop PR（CI 全绿、零测试） | [challenges/c3-slop-pr.diff](challenges/c3-slop-pr.diff) | 禁用依赖、空壳抽象层、重复 helper、改名复活废弃逻辑；产出合入决策 + 返工指令 + 前移门禁 |

## 运行

```bash
cd examples
npx tsx 04-ai-review-dojo/run-all.ts      # 三个挑战一键复现
# 也可单独运行：
npx tsx 04-ai-review-dojo/repro/c1-repro.ts
npx tsx 04-ai-review-dojo/repro/c2-repro.ts
npx tsx 04-ai-review-dojo/repro/c3-repro.ts
```

预期输出结尾：`道场全部用例通过：3/3 个挑战（DOJO-C1, DOJO-C2, DOJO-C3）`。
仅使用根工程已有的 `tsx` + `node:assert`，无新增依赖、无需网络与 API Key。

- **C1**：穷举 SSE 字节流的全部单字节切点 + 50 组随机分包——修复版恒输出「你好」，雷版在数十个切点静默丢帧；
- **C2**：用确定性 mock 模型演示完整攻击链（备注注入 → 越权 → 未审批退款），再演示修复版四道防线（会话鉴权 / 数据隔离 / 审批门 / 幂等）；
- **C3**：静态题没有可执行修复版，门禁脚本负责保证 PR 夹具的 slop 信号完整、与答案册不失配。

## 目录结构

```
04-ai-review-dojo/
├── README.md                 # 本文件（任务书，可直接发给候选人）
├── run-all.ts                # 一键复现入口
├── challenges/               # 考题：AI 生成的雷源码（含缺陷，勿用于生产）
│   ├── c1-buggy-sse-chat.ts
│   ├── c2-buggy-agent-refund.ts
│   └── c3-slop-pr.diff
├── solutions/                # 修复版（面试时收走）
│   ├── c1-fixed-stream.ts
│   └── c2-safe-agent.ts
├── repro/                    # 可运行复现/门禁（断言全部基于真实执行）
│   ├── c1-repro.ts
│   ├── c2-repro.ts
│   └── c3-repro.ts
└── answers/                  # 答案册：分级清单 + 评分锚点（面试时收走）
    ├── c1-answers.md
    ├── c2-answers.md
    └── c3-answers.md
```

## 评分量表（通用）

| 维度 | 优秀 | 不及格 |
|------|------|--------|
| 问题检出 | 安全/竞态/分帧等非功能问题找得比埋点多 | 只看出语法与风格 |
| 严重度分级 | blocker 与 nit 分明，敢放行假疑点 | 全盘怀疑或全盘相信 |
| 证据驱动 | 运行复现、写反例让 Agent 自证 | "我觉得可能有问题" |
| 成本判断 | 抓结构性问题，nit 合并成一条 | 每条意见都要求重写 |
| 防复发 | 输出规则文件/门禁/回归测试 | 只让 AI 重写一遍 |

一票否决：看不懂的代码照合；认为"有测试 = 正确"；对 AI 产出整体盲信或整体蔑视。
