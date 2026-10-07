# EP.02 CSS 层叠上下文

> 对应正文：[docs/02-css.md](../docs/02-css.md)（CSS-A1 层叠上下文的形成条件与七层层叠顺序；关联 CSS-I1 外边距合并 / CSS-I2 BFC 块级格式化上下文）· 配套示例：`../examples/02-css/a1-stacking-context.html`、`../examples/02-css/i2-bfc.html`、`../examples/02-css/i1-margin-collapse.html`

## 剧情回顾

- **第 1 格**：小研发现弹窗写了 `z-index: 9999`，却被 `z-index: 2` 的卡片盖住；码叔让她先查弹窗的「户口」在哪。
- **第 2 格**：码叔解释「隔离罩效应」：`transform`、`opacity`、`filter`、`position + z-index` 都会给元素罩一个独立的层叠上下文。
- **第 3 格**：实证一行 `transform: translateZ(0)` 如何让 9999 困在罩内、2 反而赢。
- **第 4 格**：结案口诀——z-index 失效先查父级；弹层想全屏，挂到 body 直下跳出罩。

## 知识点拆解

### 第 1 格 · z-index 不是全站排名

- z-index 的数值只在**同一个层叠上下文**里比大小，不是全站统一排行榜；
- 两个元素若分属不同的层叠上下文，先由各自的「上下文容器」在外层比较，子元素数值再大也不能越级；
- 所以 `9999` 输给 `2`，比的从来不是两个数字，而是两个父级的排名。

### 第 2 格 · 隔离罩效应

- 常见的层叠上下文形成条件（与 CSS-A1 答案一致）：根元素 html、`position` 非 static 且 `z-index` 非 auto、`opacity < 1`、`transform / perspective / filter` 非 none、`will-change` 命中相关属性、`isolation: isolate`、flex/grid 子项且 z-index 非 auto；
- 层叠上下文是一个**封闭空间**：内部元素怎么排都出不了这层罩；
- 对外比较时，整个上下文作为一个整体，以容器自身的 z-index 参与父级排序。

### 第 3 格 · 一行 transform 翻车

```css
.card { transform: translateZ(0); }   /* ① 创建层叠上下文 */
.card .modal { z-index: 9999; }       /* ② 被困在 .card 的罩内 */
.sibling { z-index: 2; }              /* ③ 和 .card 平级，比较的是 .card 的排名 */
/* 结果：2 赢，9999 出不了罩 */
```

- `translateZ(0)` 常被用来「强行提升合成层」做性能优化，但它同时偷偷创建了层叠上下文；
- `.card` 自身 z-index 为 auto，按 0 层次参与排序，平级的 `.sibling`（z-index: 2）整体盖过它，连同里面 9999 的弹窗；
- 结论：**谁创建上下文，谁就是比较边界**；排查层级冲突的第一步，是确认两个元素是否属于同一上下文。

### 第 4 格 · 失效先查父级

- 沿祖先链检查 `transform / opacity / filter / will-change` 等属性，找到最近的层叠上下文祖先；
- 弹层类组件（Modal、Select 下拉、Tooltip）的工程惯例：默认渲染到 `body` 直下（Portal），从结构上跳出父级罩子；
- 同一上下文内部从底到顶有七层绘制顺序（背景边框 → 负 z-index → 块级盒 → 浮动盒 → 内联盒 → z-index:0/auto 定位元素 → 正 z-index），需要精排时再查这张表。

## 坑点清单

1. **transform/opacity 困住子元素**：为做动画或合成层优化加上的属性会顺带创建层叠上下文，全屏弹层应挂到 body 直下「跳出罩」；
2. **z-index 失效先查父级上下文**：不要盲目加大数值，沿祖先链排查 transform / opacity / filter，找到比较边界；
3. 延伸提醒：BFC 与层叠上下文是两回事——`overflow: hidden`、`display: flow-root` 解决的是浮动塌陷与 margin 合并（见 CSS-I1/I2），不要拿来治层级问题。

## 自测 3 题（含答案）

1. 为什么 `z-index: 9999` 的弹窗会被 `z-index: 2` 的卡片盖住？——**弹窗祖先因 transform 等属性创建了层叠上下文，9999 只在罩内有效；对外比较的是父级（z-index auto 按 0 层参与），2 所在的平级元素整体更高**。
2. 哪些常见 CSS 属性会悄悄创建层叠上下文？——**opacity 小于 1、transform/filter/perspective 非 none、position 非 static 且 z-index 非 auto、will-change、isolation: isolate 等**。
3. 弹层组件为什么通常用 Portal 挂到 body 下？——**跳出业务容器里的层叠上下文，避免被父级的 transform/overflow 困住，保证遮罩与弹层在全站层级中正常置顶**。
