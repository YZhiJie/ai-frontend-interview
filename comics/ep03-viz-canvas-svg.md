# EP.03 Canvas vs SVG

> 对应正文：[docs/03-data-visualization.md](../docs/03-data-visualization.md)（VIZ-B1 Canvas 与 SVG 技术特性对比 / VIZ-B2 传感器曲线与组织架构图选型 / VIZ-I1 D3 数据绑定 / VIZ-I2 Three.js 3D 场景 / VIZ-A3 百万级数据点渲染优化）· 配套示例：`../examples/03-data-visualization/a3-large-data-canvas.html`、`../examples/03-data-visualization/i1-d3-binding.html`、`../examples/03-data-visualization/i2-three-basic.html`

## 剧情回顾

- **第 1 格**：小研接到需求——大屏画一万条实时曲线，纠结用 SVG 还是 Canvas；码叔让她先问数量、交互、缩放三个问题。
- **第 2 格**：码叔点破两派本质：SVG 是管「对象」的保留模式，Canvas 是管「像素」的即时模式。
- **第 3 格**：小研直接上选型矩阵，按图形数量、交互频率、缩放需求、开发成本四行抄作业。
- **第 4 格**：结案——高手都是混着用的：大数量用 Canvas/WebGL，少而需交互用 SVG，复杂大屏各画各的层。

## 知识点拆解

### 第 1 格 · 一万条曲线之选

- 这不是「谁更快」的玄学题，而是**图元数量 × 刷新频率 × 交互精细度**三个变量的权衡（与 VIZ-B2 判据一致）；
- 一万条曲线 × 60fps：用 SVG 意味着维护一万个真实 DOM 节点，样式布局开销先崩；
- 用 Canvas 则要回答另一个问题：画布只有一个 DOM 节点，点击命中了哪条曲线，得自己算。

### 第 2 格 · 对象派 vs 像素派

- **SVG（保留模式）**：每个图形都是真实 DOM 图元，节点即元素；事件监听开箱即用，支持 `pointer-events`、CSS 动画与滤镜；矢量描述任意缩放不失真；代价是节点一多（数千以上）就卡在 DOM 重排重绘；
- **Canvas 2D（即时模式）**：JS 调绘图指令逐帧画入像素缓冲区，画完即「忘」，不保留对象结构；高频重绘性能与 DOM 解耦，上万图元也扛得住；代价是命中检测（`isPointInPath` 或 zrender/Fabric 等场景图库）、文本与高 DPI 适配都要手动处理；
- 一句话：**SVG 慢在 DOM，Canvas 苦在交互**。

### 第 3 格 · 选型矩阵

| 维度 | SVG | Canvas |
| --- | --- | --- |
| 图形数量 | 少而精，上千即重 | 上万条也扛得住 |
| 交互频率 | 原生 DOM 事件，省心 | 自己算命中检测 |
| 缩放需求 | 矢量无损缩放 | 位图放大发糊，需按 devicePixelRatio 扩大画布重绘 |
| 开发成本 | 低，声明式 | 高，命令式手刷 |

- 工业监控大屏（万级数据点、每秒滚动刷新）选 Canvas，可配合增量绘制与分层 canvas；
- 组织架构图（数百节点、点击拖拽 hover）选 SVG，天然获得事件委托、CSS hover 与无障碍能力；
- ECharts 可按图表粒度切换 `renderer: 'canvas' | 'svg'`，D3 生成的 SVG 中高频图层也可局部换成 Canvas。

D3 的 SVG 数据绑定走 enter/update/exit 三集（详见 `i1-d3-binding.html`）：

```js
const circles = d3.select('#svg').selectAll('circle').data([10, 25, 40]);
circles.enter().append('circle')   // 数据多、节点少 → 补建
  .merge(circles)                  // 与 update 集合并，统一设属性
  .attr('fill', 'steelblue');
// 节点多、数据少时的 exit 集必须显式 remove()
```

### 第 4 格 · 混搭才是答案

- 海量点线的第一优先级是数据侧降采样（LTTB 保形状、min-max 保极值），再上 WebGL 批量提交，纯 DOM/SVG 在百万量级不可行（VIZ-A3）；
- 统计、降采样等纯计算移入 Web Worker，渲染用 rAF 分片调度，主线程只负责画；
- 3D 数字孪生类需求直接走 WebGL/Three.js（五件套 Scene / Camera / Renderer / Light / Mesh，见 `i2-three-basic.html`）。

## 坑点清单

1. **SVG 改属性会触发 DOM 重排**：高频动画不要逐帧改几何属性，走 `transform` / `opacity` 合成通道；
2. **Canvas 高频重绘要 rAF 节流**：把绘制集中进 requestAnimationFrame，一帧只画一次，并按 devicePixelRatio 处理高分屏模糊；
3. 别背「Canvas 一定快」：图元少、交互重的场景，手写命中检测与无障碍补齐的成本远高于直接用 SVG。

## 自测 3 题（含答案）

1. 万级数据点每秒刷新的监控曲线为什么不选 SVG？——**SVG 每个图元都是真实 DOM 节点，上万个节点的样式布局与重排重绘开销不可接受；Canvas 逐帧绘制与 DOM 解耦，配合分层和增量绘制可支撑高频重绘**。
2. Canvas 上做图形点击交互要解决什么问题？——**Canvas 只有一个 DOM 节点，没有原生图元事件，需要自己做坐标命中检测（isPointInPath 或用 zrender、Fabric.js 等场景图库）**。
3. 同一复杂大屏里两种技术能共存吗？——**能，也是推荐做法：静态、需交互的图层用 SVG，海量高频图层用 Canvas/WebGL，各画各的层；ECharts 还可按图表粒度选 renderer**。
