# 01-javascript 运行手册

JavaScript 底层原理领域配套可运行 TypeScript 示例。所有命令均在 **`examples/` 根目录**执行，
npx 会自动找到根 `node_modules/.bin/tsx`（已安装 tsx v4.23.15，Node v24.17.0 实跑通过）。

## 统一运行命令

```bash
# 在 examples 目录下
npx tsx 01-javascript/<文件名>.ts
```

## 文件 → 题号映射

| 文件 | 对应题号 | 主题 |
| --- | --- | --- |
| `b1-execution-context.ts` | JS-B1 | 执行上下文创建/执行阶段：var 提升、函数声明提升、let/const 的 TDZ |
| `b3-closure.ts` | JS-B3 | 闭包：私有变量计数器 + 防抖 debounce（虚拟时钟模拟连续调用） |
| `b4-promise-order.ts` | JS-B4 | Promise 基础顺序：start → end → then → timeout（含 node:assert 断言） |
| `b5-var-let-loop.ts` | JS-B5 | var 版输出 3/3/3 与 let 版输出 0/1/2 对照，附 IIFE 修复 |
| `i1-macro-micro-order.ts` | JS-I1 | 宏微任务混合调度 8 行输出（实跑序列已写入文件头注释） |
| `i2-async-await-order.ts` | JS-I2 | async/await + then 混合顺序（实跑序列已写入文件头注释） |
| `i3-long-task.ts` | JS-I3 | 500ms 同步长任务阻塞心跳 vs MessageChannel 分片调度对照 |
| `i4-ast-nodes.ts` | JS-I4 | `const x = 1 + 2` 精简 AST 节点断言 + 常量折叠 1+2→3 |
| `a2-babel-plugin/` | JS-A2 | Babel 插件式脚本：parse → traverse 去除 console.* → generate |

> 题号 JS-B2（词法作用域）、JS-A1（浏览器/Node 事件循环差异）、JS-A3（性能优化案例）
> 为纯理论/架构题，无独立示例文件；JS-A1 的 Node 侧队列行为可参考 b4/i1 的实跑。

## 预期输出摘要（真实运行结果，Node v24.17.0）

- **b1**：声明前读 var 得到 `undefined`；let 声明前访问抛 `ReferenceError: Cannot access 'b' before initialization`；两个计数器闭包状态独立。
- **b3**：私有 `count` 外部读取为 `undefined`；5 次连续输入防抖后搜索**只执行 1 次**，关键词为最后一次的 `abcde`。
- **b4**：`start` → `end` → `then`（微任务）→ `timeout`（宏任务），断言通过。
- **b5**：先打印同步阶段结束行，随后 `var: 3` × 3，再 `let: 0/1/2`，IIFE 版输出 0/1/2。
- **i1**：`1 8 4 7 5 2 3 6`，与文档参考答案一致。
- **i2**：`script start → async1 start → async2 → promise1 → script end → async1 end → promise2 → setTimeout`，与文档参考答案一致。
- **i3**：同步版 500ms 内心跳触发 **0 次**、心跳最大间隔约 500ms；分片版（8ms/片，共 50 片）心跳触发 50 次、最大间隔约 17ms，总耗时约 511ms（让出开销）。
- **i4**：打印折叠后的 AST 树（init 节点已变为 `Literal(3)`），节点类型/层级断言通过。
- **a2-babel-plugin**：转换前 3 条语句位置 `console.*` 在转换后被删除；表达式位置的 `console.warn(...)` 替换为 `void 0`；`logger.log(...)` 保留。

## a2-babel-plugin 依赖安装（已由 workspace 统一安装）

```bash
# 在 examples/ 根目录执行一次即可（a2-babel-plugin 是 examples pnpm workspace 成员）：
pnpm install --registry=https://registry.npmmirror.com

# 运行（同样在 examples/ 目录）
npx tsx 01-javascript/a2-babel-plugin/remove-console.ts
```

依赖：`@babel/parser`、`@babel/traverse`、`@babel/generator`、`@babel/types`（均 `^7.26.0`），
类型声明 `@types/babel__traverse`、`@types/babel__generator`（devDependencies）。
