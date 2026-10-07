# 二、CSS 底层原理

> 本领域聚焦 CSS 渲染管线与布局机制的底层原理：盒模型与尺寸计算、选择器优先级与层叠上下文、格式化上下文（BFC）、定位体系与合成层性能，是区分「会调样式」与「懂渲染」的分水岭。在 AI 时代，样式代码大量由 AI 生成，能否一眼识别层级冲突、外边距塌陷与渲染性能瓶颈，直接体现工程师的 CSS 功底与代码审查能力。

**题量分布**：Basic 3 题 · Intermediate 3 题 · Advanced 3 题（共 9 题）

**🎬 配套漫画**：[EP.02 CSS 层叠上下文](../comics/ep02-css-stacking.svg)

---

## 🟢 Basic（基础）

### CSS-B1｜标准盒模型 vs 怪异（IE）盒模型

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请解释标准盒模型与怪异（IE）盒模型的区别，说明两种模型下 width/height 分别包含哪些部分，并说明 box-sizing 两个取值各自对应的模型与工程中的推荐用法。
- **考察要点**：
  - 盒模型四层结构：content、padding、border、margin
  - 两种模型下 width 的语义差异
  - box-sizing 取值与全局重置实践
- **参考答案要点**：
  - 标准盒模型（content-box）：width/height 只等于内容区尺寸，实际占位 = content + padding + border（间距再加 margin）。
  - 怪异盒模型（border-box）：width/height 已包含 padding 与 border，内容区被压缩为 width − padding − border。
  - box-sizing: content-box 为默认值（标准模型）；box-sizing: border-box 对应怪异模型。
  - 工程实践通常全局设置 `*, *::before, *::after { box-sizing: border-box }`，让设定尺寸即最终尺寸，避免 padding 撑破布局。
  - 注意：margin 永远不计入 width/height，两种模型下都只影响元素间的占位间距。

### CSS-B2｜盒模型尺寸计算

- **题型**：理论概念题 + 代码分析题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  有如下样式，请分别按 box-sizing 为 content-box 与 border-box 两种情况计算：①内容区（content）尺寸；②实际渲染宽高（不含 margin）；③含 margin 的总占位尺寸（要求给出具体数字）。

```css
.box {
  width: 200px;
  height: 100px;
  padding: 20px;           /* 四边均为 20px */
  border: 5px solid #000;  /* 四边均为 5px */
  margin: 10px;            /* 四边均为 10px */
}
```

- **考察要点**：
  - 两种 box-sizing 下的宽高计算公式
  - padding/border 在两种模型中的归属关系
  - margin 只参与占位、不参与盒模型宽高
- **参考答案要点**：
  - content-box：内容区 200 × 100；实际渲染宽 = 200 + 20×2 + 5×2 = 250px，高 = 100 + 20×2 + 5×2 = 150px；含 margin 总占位 270 × 170。
  - border-box：内容区宽 = 200 − (20+5)×2 = 150px，高 = 100 − (20+5)×2 = 50px；实际渲染宽高恒等于 200 × 100；含 margin 总占位 220 × 120。
  - 核心公式：content-box 实际宽 = width + 2×padding + 2×border；border-box 实际宽恒等于 width。
  - 交叉验证：两种模型含 margin 总占位相差 270 − 220 = 50px，恰为 (20+5)×2，即被 width「吸收」的 padding 与 border 双侧之和。

### CSS-B3｜选择器优先级计算

- **题型**：理论概念题 + 代码分析题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请解释 CSS 优先级的四元组权值记法（内联、id、class/属性/伪类、元素/伪元素）与比较规则，并比较以下三个选择器的优先级大小（写出各自的权值）：
  - 甲：`#header .nav .item:hover`
  - 乙：`#header #nav ul li a`
  - 丙：`.layout .main .content .title`
- **考察要点**：
  - 四元组逐位比较、高位压倒低位的规则
  - !important 与内联 style 在整条比较链中的位置
  - 同优先级时按源码顺序后者覆盖
- **参考答案要点**：
  - 权值记法 (a, b, c, d)：a = 内联 style，b = id 个数，c = class/属性选择器/伪类个数，d = 元素/伪元素个数；通配符 * 与组合符（>、+、~）不计权值。
  - 权值结果：甲 = (0, 1, 3, 0)（.nav、.item、:hover）；乙 = (0, 2, 0, 3)（#header、#nav、ul、li、a）；丙 = (0, 0, 4, 0)。
  - 结论：乙 > 甲 > 丙。乙胜甲是因为 b 位 2 > 1——class 数量再多也压不过 id；甲胜丙是 b 位 1 > 0。
  - !important 把声明提到所有普通优先级之上（例外：后写的 !important 与内联 !important 之间仍按上述规则比较）；内联 style 相当于 a 位 = 1。
  - 比较规则：从左到右逐位比较，高位相等才看下一位；四项全等时按源码顺序，后者生效。

## 🟡 Intermediate（进阶）

### CSS-I1｜外边距合并（Margin Collapse）

- **题型**：理论概念题 + 代码分析题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  请说明外边距合并的三种触发条件（相邻兄弟、父子、空块），并推演以下代码中 `.top` 与 `.bottom` 之间的视觉间距是多少：

```html
<div class="top"></div>
<div class="gap"></div>
<div class="bottom"></div>
```

```css
.top    { height: 50px; margin-bottom: 30px; background: #eee; }
.gap    { /* 空块：无高度、无 border/padding、默认 margin 0 */ }
.bottom { height: 50px; margin-top: 20px; background: #ddd; }
```

  追问：若 `.top` 的 margin-bottom 改为 -10px，间距又是多少？正负 margin 相遇的计算规则是什么？请再给出至少 3 种阻止合并的方法。
- **考察要点**：
  - 三种触发条件与「普通流块级盒」这一前提
  - 空块自身上下 margin 合并后会继续与相邻 margin 参与同一组合并
  - 正正取大、正负相加、负负取小（绝对值大者）的符号规则
- **参考答案要点**：
  - 触发条件：①相邻兄弟的上/下 margin；②父元素与第一个/最后一个子元素之间（中间无 border、padding、行内内容分隔，且父元素未建立 BFC）；③高度为 0 的空块级元素自身的上下 margin 相互合并。
  - 推演：`.gap` 是空块，自身上下 margin（0,0）合并后继续与相邻的 30px、20px 融入同一组合并，全部为正取最大值 → 视觉间距为 30px，而不是 30 + 20 = 50px。
  - 负值规则：正正取大；正负相加（本例 -10 与 20 相遇 → -10 + 20 = 10px）；负负取绝对值大者（-30 与 -20 → -30）。
  - 阻止方法一：父元素建立 BFC（display: flow-root 或 overflow: hidden），阻断父子方向的合并。
  - 阻止方法二：在父子间加 padding 或 border 隔断；方法三：改用 flex/grid 布局容器（其子项之间不合并）。
  - 补充：float、absolute、inline-block 元素不参与普通流合并流程，也可用于阻断。
  - 记忆点：合并只发生在「普通流中的块级盒」之间，任何让盒子脱离普通流或建立新 BFC 的手段都能阻断。

### CSS-I2｜BFC 块级格式化上下文

- **题型**：理论概念题 + 实际场景应用题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  什么是 BFC？列出常见触发条件，并结合 3 个实际场景（清除浮动、防止父子 margin 合并、自适应两栏布局）分别说明 BFC 解决了什么问题、为什么能解决。
- **考察要点**：
  - BFC 是独立渲染区域：内部布局与外部互相隔离
  - 触发条件中 display: flow-root 是无副作用的首选
  - 三个应用背后的同一原理：隔离性 + 不与浮动盒重叠
- **参考答案要点**：
  - BFC（Block Formatting Context）是独立的块级渲染区域：内部子元素的布局不影响外部，外部也不影响内部。
  - 触发条件：根元素 html；float 非 none；position 为 absolute/fixed；display 为 flow-root / inline-block / table-cell / flex / grid；overflow 为 hidden / auto / scroll（即非 visible）。
  - 场景一（清除浮动）：容器建立 BFC 后会把内部浮动子元素包裹进来，容器高度不再塌陷；首选 display: flow-root，无副作用。
  - 场景二（防止 margin 合并）：给父元素建立 BFC 可阻断父元素与子元素之间的外边距合并。
  - 场景三（自适应两栏）：左栏 float: left 固定宽，右栏建立 BFC 后不与浮动盒重叠（BFC 区域不会与 float 元素交叠），从而自动收缩避让、实现自适应。
  - 对比提醒：overflow: hidden 可能裁剪内容或产生新滚动容器；float/absolute 会改变布局性质，flow-root 是语义与副作用最优的方案。

### CSS-I3｜五种定位综合布局实现

- **题型**：实际场景应用题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  场景约束：实现一个后台管理系统骨架——顶部导航（始终固定在视口顶部）、左侧栏（滚动到导航下沿后吸顶跟随）、中部内容区（参与文档流滚动）、右下角悬浮客服按钮（带数字角标）。要求五种定位 static / relative / absolute / fixed / sticky 各用上一次，给出关键 CSS，并逐一说明每种定位的取舍（是否脱离文档流、包含块是谁）。
- **考察要点**：
  - 五种定位在文档流行为与包含块判定上的差异
  - sticky 依赖最近滚动祖先，且有失效条件
  - fixed/sticky 脱离或部分脱离文档流后的空间补偿策略
- **参考答案要点**：
  - 关键 CSS：

```css
/* 顶部导航：fixed 相对视口定位，脱离文档流 */
.nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  z-index: 100;
}
/* 导航内图标：relative 原位微调，不脱离文档流 */
.nav-logo { position: relative; top: 1px; }
/* 吸顶侧栏：sticky 相对最近滚动祖先吸附，不脱离文档流 */
.sidebar {
  position: sticky;
  top: 56px;                      /* 吸附点 = 导航下沿 */
  height: calc(100vh - 56px);
}
/* 内容区：static 常规流，padding 补偿 fixed 导航的占位 */
.content { padding-top: 56px; margin-left: 220px; }
/* 客服按钮：fixed 定位到视口右下角 */
.fab { position: fixed; right: 24px; bottom: 24px; }
/* 角标：absolute 相对最近的定位祖先（fixed 的 .fab 也是定位元素） */
.fab-badge { position: absolute; top: -4px; right: -4px; }
```

  - fixed（导航/客服按钮）：脱离文档流、相对视口定位，滚动时视觉稳定，但必须用 padding 等手段补偿占位，否则遮挡内容。
  - sticky（侧栏）：不脱离文档流、保留占位，滚动到 top 阈值后吸附；依赖最近的滚动祖先，且祖先 overflow 非 visible/clip 时会失效。
  - static（内容区）：零成本参与文档流，天然充当 sticky 侧栏的滚动祖先；只需 padding-top 补偿 fixed 导航。
  - relative（图标微调）：保留原占位，仅做视觉偏移；更重要价值是充当 absolute 子元素的包含块。
  - absolute（角标）：完全脱离文档流，相对最近定位祖先偏移；依赖父级被正确「定位化」，滥用易导致布局碎片化。

## 🔴 Advanced（高级）

### CSS-A1｜层叠上下文的形成条件与七层层叠顺序

- **题型**：理论概念题 + 代码分析题
- **难度**：Advanced ★★★★★
- **问题描述**：
  请列举层叠上下文的形成条件（至少 5 类），写出同一层叠上下文内从底到顶的七层绘制顺序，并分析以下经典案例：为什么 `.child` 的 z-index 高达 9999，仍然被 `.rival` 盖住？

```html
<div class="parent">
  <div class="child">z-index: 9999</div>
</div>
<div class="rival">z-index: 1</div>
```

```css
.parent {
  position: relative;
  transform: translateZ(0); /* 关键：形成层叠上下文 */
}
.child {
  position: absolute;
  z-index: 9999;
}
.rival {
  position: relative;
  z-index: 1;
}
```

- **考察要点**：
  - 形成条件：根元素、定位 + z-index、transform/opacity/filter/will-change、flex/grid 子项 z-index 等
  - 七层绘制顺序与「层叠上下文是封闭空间」
  - z-index 只在所属上下文内部比较，不能跨上下文逃逸
- **参考答案要点**：
  - 形成条件：①根元素 html；②position 非 static 且 z-index 非 auto；③flex/grid 子项且 z-index 非 auto；④opacity < 1；⑤transform / perspective / filter / mask 非 none；⑥will-change 声明了可形成上下文的属性；⑦isolation: isolate、mix-blend-mode 非 normal 等。
  - 七层顺序（底 → 顶）：①上下文根元素的背景与边框；②负 z-index 的子层叠上下文；③普通流中非定位块级盒；④浮动盒；⑤普通流中非定位内联盒；⑥z-index: 0 / auto 的定位元素及层叠上下文元素；⑦正 z-index 的子层叠上下文。
  - 案例推演：transform 使 `.parent` 成为独立层叠上下文，`.child` 的 9999 只在 parent 内部比较，无法「逃逸」到外层。
  - 对外比较时 `.parent` 整体参与：其 z-index 为 auto（按 0 层次参与定位元素排序），而 `.rival` 的 z-index 为 1，位于第 7 层之上比较，故 rival 整体盖住 parent 连同 child。
  - 结论：z-index 数值只在同一层叠上下文内有效；排查层级冲突的第一步是确认两个元素是否属于同一上下文。

### CSS-A2｜复杂场景 CSS 渲染性能优化

- **题型**：实际场景应用题
- **难度**：Advanced ★★★★★
- **问题描述**：
  场景约束：某长列表页在低端机上滚动掉帧。排查发现：列表条目动画使用了 width/left 过渡、行样式使用了大模糊半径的 box-shadow、且为几百个条目同时声明了 will-change: transform。请从渲染管线（重排 / 重绘 / 合成）的角度解释掉帧原因，并给出系统性优化方案（动画属性选择、will-change 使用策略、合成层爆炸治理、大面积 paint 规避等）与量化验证手段。
- **考察要点**：
  - 渲染管线三阶段 Layout（重排）→ Paint（重绘）→ Composite（合成）的开销差异
  - transform/opacity 动画为何能跳过重排与重绘
  - 合成层的内存代价与「层爆炸」的形成与治理
- **参考答案要点**：
  - 管线差异：重排（几何变化，重算布局，最贵）→ 重绘（外观变化，重新光栅化）→ 合成（已分层纹理由 GPU 移动，最便宜）；动画应尽量停留在合成阶段。
  - width/left 动画每帧都触发重排 + 重绘；改为 transform: translateX/scaleX 后由合成器线程处理，即使主线程繁忙动画也不掉帧。
  - 大模糊 box-shadow、大范围渐变属于大面积 paint，光栅化开销高，应降低模糊半径、缩小绘制区域或用预渲染伪元素替代。
  - 本例层爆炸根因：几百个元素同时 will-change: transform，每个都被提升为合成层，层与层都要占用内存并上传纹理，低端机直接崩帧。
  - 治理策略：只对「即将动画的少量元素」声明 will-change，动画结束后移除；用 DevTools 的 Layers 面板检查层数量与显存占用。
  - 补充手段：content-visibility: auto 跳过屏外元素渲染、contain: strict 限制重排影响范围、虚拟列表从总量上减少节点。
  - 量化验证：Performance 面板对比 FPS 曲线，开启 Paint flashing 观察绿色重绘区域应显著减少，目标滚动稳定 60 FPS。

### CSS-A3｜position: sticky 的跨浏览器兼容方案

- **题型**：技术选型题
- **难度**：Advanced ★★★★☆
- **问题描述**：
  场景约束：某 to B 产品的表格表头吸顶功能选用了 position: sticky，需要兼容老版 Safari（iOS 12），政企内网的旧版浏览器以 IE11 为底线（可接受功能降级但不可白屏）。请给出完整的兼容性解决方案：@supports 特性检测写法、降级方案、Autoprefixer/Browserslist 工程配置，以及渐进增强的实施策略；并说明 sticky 在真实项目中最常见的两个「失效陷阱」。
- **考察要点**：
  - @supports 检测语法（含 -webkit- 前缀的写法）
  - 降级实现：JS 监听滚动 + 类名切换模拟吸附，或接受 static 基线
  - 工程链路：Browserslist 驱动 Autoprefixer 自动补前缀
- **参考答案要点**：
  - 现状判断：sticky 已被现代浏览器全量支持（Chrome 91+ / Edge 79+ / Firefox 32+ / Safari 6.1+ 需 -webkit- 前缀），仅老浏览器需要降级，选型成立。
  - 特性检测与前缀：

```css
.table-head {
  position: -webkit-sticky; /* 老版 Safari 需要 */
  position: sticky;
  top: 56px;
}
/* 不支持时走 static 基线：表格功能完整，只是不吸附 */
@supports not ((position: sticky) or (position: -webkit-sticky)) {
  .table-head { position: static; }
}
```

  - 降级方案：不支持时由 JS 兜底——rAF 节流监听 scroll，用 getBoundingClientRect 判断表头是否越过阈值，切换 .is-fixed 类并用 fixed + 等高占位模拟吸附；若已放弃 IE11 也可直接接受 static 基线、不加载降级脚本。
  - 工程配置：在 Browserslist 中声明目标浏览器（如 `"last 2 versions", "safari >= 7", "not dead", "not ie <= 10"`），Autoprefixer 据此自动补 -webkit-sticky，避免手写前缀漂移。
  - 渐进增强策略：先保证 static 基线完整可用 → 支持的浏览器叠加吸附体验 → 降级脚本仅在特性检测失败时按需加载，符合「核心体验优先、增强体验分层」。
  - 失效陷阱一：任意祖先元素 overflow: hidden / auto / scroll（非 visible/clip）会让 sticky 失效；陷阱二：sticky 元素受父容器高度约束（父容器必须比它高），且 top 必须显式设置，否则不产生吸附。

---

## 📌 本领域高频考点速记

- border-box 的 width 已含 padding 与 border；content-box 需外加，两者占位都要再加 margin。
- 优先级四元组 (内联, id, class, 元素) 逐位比较，!important 提到普通声明之上，同优先级后者覆盖。
- margin 合并只发生在普通流相邻块级盒之间：正正取大、正负相加、负负取小。
- 阻止合并与清除浮动首选 display: flow-root——语义化建立 BFC、无副作用。
- sticky 依赖最近滚动祖先：祖先 overflow 非 visible/clip、父容器过矮、未设 top 都会失效。
- 层叠上下文是封闭空间：transform/opacity/filter 等都会创建，子元素 z-index 无法逃逸。
- 动画只用 transform/opacity：跳过 Layout 与 Paint，由合成器线程驱动。
- will-change 是提前分层的「契约」，滥用会导致合成层爆炸（内存与纹理上传暴涨）。
- 开销顺序：重排 > 重绘 > 合成；读写分离可避免强制同步布局。
- 渐进增强三步：static 基线可用 → @supports 能力检测叠加增强 → 降级脚本按需加载。
