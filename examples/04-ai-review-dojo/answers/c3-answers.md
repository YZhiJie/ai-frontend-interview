# C3 答案册｜架构 slop PR 审查（对应 AI-A6）

> 审查对象：[../challenges/c3-slop-pr.diff](../challenges/c3-slop-pr.diff)
> 完整性门禁：`npx tsx 04-ai-review-dojo/repro/c3-repro.ts`

## 合入决策：退回重做（rework）

两个 blocker 违反 AGENTS.md 明示的硬约束，且 420 行改动零测试。
这类问题不是逐行评论能修干净的——让 Agent 删着改只会留下半截工厂残骸，必须带约束重做。

## 分级意见

### 🔴 blocker（2 个，必须重做）

1. **引入禁用依赖 `@legacy/easy-store`** —— 团队状态管理统一 zustand，引入第二个状态库会形成双轨数据，
   后续每个新页面都要回答"该用哪个 store"，治理成本远超这个 PR 的收益。
2. **`applyPromotionLegacy` 复活已下线的 v1 优惠券链路** —— 仍调用 `/api/v1/coupons/*` 废弃接口；
   v1 逻辑下线意味着业务规则（风控、结算口径）已经失效，静默复活 = 行为回退 + 生产事故候选。

### 🟡 major（2 个，合入前必须处理）

3. **三层无承载抽象** `AbstractOrderFactoryFactory → DefaultOrderFactoryFactory → OrderCreator`
   + `BaseAbstractOrderService`：两个新增类在本 PR 内没有任何第二种实现、没有多态分派，
   是纯空壳负债。判据一句话：**说不出它分派的第二种实现，就不许创建这层**（YAGNI）。
4. **`formatPriceText` 与既有 `formatPrice` 完全重复** —— 两个金额格式出口必然逐渐分叉
   （一个改了小数位、一个没改），价格展示分叉在金融相关页面是实打实的 bug 源；
   结算页改为用前者，还留下了未使用的 `formatPrice` import。

### 🟢 nit（不单独打回，合并成一条评论）

- `AbstractOrderFactoryFactory` 的 JSDoc 只是把类名翻译成中文（注释复述代码）；
- `IOrderFactoryFactoryOptions` 的字段全是可选且无人使用；
- PR 描述「面向未来扩展」不是引入复杂度的理由。

## 给编码 Agent 的返工指令（满分答案要点）

> 本 PR 退回。先不要写代码：
> ① 重读 AGENTS.md 三条硬约束（zustand 统一、formatPrice 复用、v1 优惠券禁止复活）；
> ② 输出文件级返工方案：删除哪些新增文件/依赖、结算页改动保留什么，等我确认后再动手；
> ③ 删掉 `formatPriceText`，全部改回 `formatPrice`；促销需求走 v2 接口单独立项；
> ④ 每个保留行为先写失败复现测试再实现（本 PR 测试数必须 > 0）；
> ⑤ 完成后把规则「新增抽象层必须先在方案中给出它要分派的第二种实现，否则禁止创建」
> 追加进 AGENTS.md，并在 PR 描述勾选「未引入新依赖/未改动架构约束」声明。

**评分点**：好指令给约束与验收标准（为什么、边界、验收），而不是逐行代写；
要求 Agent 更新规则文件，是让这次教训"对未来所有 PR 生效"。

## 流程门禁（让这类 PR 到不了 reviewer 面前）

| 门禁 | 拦截对象 | 落地方式 |
|------|---------|---------|
| 依赖白名单 | `@legacy/easy-store` 类未登记依赖 | lockfile diff 检查脚本/`allowedDependencies`，CI 直接红 |
| 架构约束扫描 | 废弃接口调用、禁用模块 | 简单 grep 规则即可（`/api/v1/coupons`、`easy-store`） |
| 重复代码检测 | `formatPriceText` 类重复 helper | jscpd 阈值或 CI 评论同构函数 |
| 新代码测试门禁 | 420 行零测试 | 覆盖率检查只对**新增行**生效，不为 0 才放行 |
| AI PR 模板 | 全部 slop | 强制填写「引入了哪些新依赖/改动了哪些既有约定/为什么」，空着不能提交 |

## 评分本质

高级工程师审查 AI PR 的交付物不是批注集合，而是三样东西：
**决策**（退不退）+ **约束**（返工指令怎么让它一次改对）+ **机制**（什么门禁让错误不再发生）。
