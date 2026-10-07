# 03 · 数据可视化技术 —— 可交互示例

纯静态 HTML，内联 `<style>` / `<script>`，零 npm 依赖。可视化库统一走 **cdnjs CDN（需联网）**：

- ECharts 5.5.0：`https://cdnjs.cloudflare.com/ajax/libs/echarts/5.5.0/echarts.min.js`
  （注：cdnjs 上 5.5.1 仅有版本元数据、实体文件 404，故取同 minor 最近可用版 5.5.0，ECharts 5 API 完全兼容）
- D3 7.9.0：`https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js`
- Three.js r128（UMD 全局 `THREE`）：`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`

## 运行方式

```bash
cd ai-frontend-interview/examples
python3 -m http.server 5500
# 浏览器打开 http://127.0.0.1:5500/03-data-visualization/<文件名>
# CDN 资源必须能访问（公司内网受限时请放行 cdnjs.cloudflare.com）
```

双击 `file://` 打开亦可运行（本目录示例均无跨域 fetch 需求），但推荐静态服务器。

## 文件 → 题号映射

| 文件 | 对应题号 | 演示内容 |
| --- | --- | --- |
| [b3-echarts-bar.html](./b3-echarts-bar.html) | VIZ-B3 | ECharts 基础柱状图：title/tooltip/legend/xAxis/yAxis/series 完整 option；月度 12 数据，可切回文档原题 Q1–Q4；演示 setOption 增量更新与 dispose/init 生命周期 |
| [i1-d3-binding.html](./i1-d3-binding.html) | VIZ-I1 | D3 General Update Pattern：enter（绿）/update（青）/exit（橙）/merge 四阶段颜色与过渡；增加、乱序改值（key 函数按 id 复用节点）、减少、文档追问 5 元素 |
| [i2-three-basic.html](./i2-three-basic.html) | VIZ-I2 | Three.js r128 五件套：Scene / PerspectiveCamera / WebGLRenderer / Ambient+DirectionalLight / BoxGeometry Mesh + GridHelper 地面；rAF 循环、resize 三件套；手写拖拽旋转（r128 CDN 不含 OrbitControls，未引用任何不存在的扩展） |
| [i3-echarts-mixed.html](./i3-echarts-mixed.html) | VIZ-I3 | 双 yAxis 柱+折线混合图（收入柱左轴、增长率折线右轴），tooltip formatter（1 位小数 + %）、slider+inside 双 dataZoom、图例联动，option 与文档答案一致 |
| [a3-large-data-canvas.html](./a3-large-data-canvas.html) | VIZ-A3 | 5 万点 Canvas 曲线：全量绘制 vs LTTB 降采样 500 点 + 视图内绘制，实时 FPS / 绘制耗时 / 降采样耗时 / 长帧统计，可切视窗大小；另附 10,000 行 DOM 虚拟列表（只渲染可视区 ~20 行） |

## 关于架构设计题

VIZ-A1（D3 力导向关系图）、VIZ-A2（Three.js 大型场景优化）、VIZ-A4（ECharts 自定义系列）为**架构设计题**，核心代码（模块划分、forceSimulation/zoom/drag 协调、InstancedMesh/LOD/KTX2 清单、renderItem/registerLayout/registerMap 扩展机制）已在 `docs/03-data-visualization.md` 的参考答案中完整给出。本目录聚焦**可在浏览器直接交互的基础 / 中档 / 性能对比实现**，故未为三道架构题制作页面；VIZ-A3 同为架构题，但其降采样/虚拟列表方案天然可交互验证，因此提供了性能对比页。
