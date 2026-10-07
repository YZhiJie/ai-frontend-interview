# 三、数据可视化技术

> 本领域考察前端工程师对浏览器绘图体系（Canvas / SVG / WebGL）与主流可视化库（ECharts、D3.js、Three.js）的原理理解与实战能力，核心是：选型有依据、性能有对策、复杂交互有架构。AI 时代，数据可视化是大模型向用户"讲数据"的主要出口——智能看板、Agent 产物呈现、3D 数字孪生都建立在这套能力之上，因此考察重心越来越偏向大规模数据与高交互场景下的工程化方案。

**题量分布**：Basic 3 题 · Intermediate 3 题 · Advanced 4 题（共 10 题）

**🎬 配套漫画**：[EP.03 Canvas vs SVG](../comics/ep03-viz-canvas-svg.svg)

---

## 🟢 Basic（基础）

### VIZ-B1｜Canvas 与 SVG 的技术特性对比

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请从渲染模型、事件模型、缩放表现、性能特征四个维度对比 Canvas 2D 与 SVG 的本质差异，并说明两者各自的适用边界。
- **考察要点**：
  - 是否理解"位图即时绘制"与"DOM 矢量图元"两种渲染模型的本质区别
  - 是否清楚两者事件处理机制（手动命中检测 vs DOM 事件）的差异
  - 是否理解矢量缩放与高 DPI 屏下两者的清晰度表现差异
  - 是否能按数据量与交互频率给出选型边界
- **参考答案要点**：
  - 渲染模型：Canvas 是即时模式的位图绘制，JS 调用绘图指令逐帧画入像素缓冲区，画完即"忘"，不保留对象结构；SVG 是保留模式的矢量文档，每个图形都是真实 DOM 图元，由浏览器渲染并参与样式、布局与无障碍树。
  - 事件模型：SVG 图元可直接 addEventListener，并支持 pointer-events 控制命中；Canvas 整体只有一个 DOM 节点，必须自己做坐标命中检测（isPointInPath 或依赖 zrender、Fabric.js 这类场景图库）。
  - 缩放表现：SVG 基于矢量描述，任意缩放不失真；Canvas 是位图，放大或高 DPI 屏下需按 devicePixelRatio 扩大画布尺寸重绘，否则模糊。
  - 性能特征：图元数量大时 SVG 的 DOM 数量与重排重绘开销成为瓶颈，适合数千以内、中低频更新；Canvas 绘制成本与 DOM 解耦，配合分层、离屏缓存可支撑上万图元高频重绘，但交互与无障碍需自行补齐。

### VIZ-B2｜传感器曲线与组织架构图的渲染选型

- **题型**：技术选型题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请为以下两个场景选择渲染方案（Canvas 或 SVG，可结合具体库说明），并给出理由：① 工业监控大屏：约 10000 个数据点的传感器曲线，每秒滚动刷新一次；② 企业组织架构图：数百个节点，需要节点点击查看详情、节点拖拽调整汇报关系。
- **考察要点**：
  - 能依据数据规模与刷新频率给出明确选型结论
  - 掌握"高频重绘大数据量用 Canvas、精细 DOM 交互用 SVG"的判据
  - 了解主流库的混合渲染能力（如 ECharts 的 renderer 配置）
- **参考答案要点**：
  - 场景①选 Canvas：万级点阵每秒整幅重绘，SVG 需维护上万 DOM 节点并承受样式/布局开销，基本不可行；Canvas 逐帧重绘成本可控，滚动场景还可配合增量绘制与分层 canvas 优化。
  - 场景②选 SVG：数百节点对 DOM 压力很小，点击/拖拽/hover 可直接绑定 DOM 事件，天然获得事件委托、CSS hover 与无障碍能力，开发效率远高于手写命中检测。
  - 折中实践：ECharts 可按图表粒度选 renderer（大数据量图表用 canvas、小型交互图用 svg）；D3 生成的 SVG 中高频变化的图层也可局部替换为 canvas。
  - 总结判据：由"图元数量 × 刷新频率 × 交互精细度"三个变量共同决定，而非背"Canvas 一定快"。

### VIZ-B3｜ECharts 基础柱状图配置实现

- **题型**：实际场景应用题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  使用 ECharts 5 实现"各季度销售额"柱状图：标题为"2025 年季度销售额"，x 轴为 Q1–Q4，y 轴为金额（元），鼠标悬浮展示 tooltip，右上角显示图例并可点击切换系列。页面已有容器与依赖，请补全 JS 部分并给出完整可运行配置：
  ```html
  <div id="chart" style="width: 600px; height: 400px;"></div>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <script>
    // TODO：初始化并配置图表
  </script>
  ```
- **考察要点**：
  - init / setOption / resize / dispose 的基本生命周期
  - title、xAxis、yAxis、series、tooltip、legend 六大核心配置项的写法
  - 理解 setOption 是声明式、增量合并的数据驱动更新
- **参考答案要点**：
  - 完整可运行配置如下：
  ```js
  // 1. 基于已有宽高的容器初始化实例，可指定渲染器
  const chart = echarts.init(document.getElementById('chart'), null, { renderer: 'canvas' });

  // 2. 声明式配置：setOption 支持增量合并
  chart.setOption({
    title: { text: '2025 年季度销售额', left: 'center' },
    tooltip: { trigger: 'axis' },                      // 类目轴对比用 axis 触发
    legend: { data: ['销售额'], right: 10 },           // 与系列名对应才会联动
    xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
    yAxis: { type: 'value', name: '金额（元）' },
    series: [{ name: '销售额', type: 'bar', data: [120, 200, 150, 80] }]
  });

  // 3. 尺寸自适应；页面卸载时应调用 chart.dispose() 防止内存泄漏
  window.addEventListener('resize', () => chart.resize());
  ```
  - series.name 必须与 legend.data 中的字符串一致，图例才能联动控制系列显隐。
  - tooltip.trigger 取 axis（类目轴整列触发）或 item（单个图形触发），按场景选择。
  - 容器必须在 init 前有非零宽高；窗口尺寸变化需调用 chart.resize() 同步画布。
  - 数据更新只需再次 setOption 传入变化字段（增量合并），不必销毁重建实例。

## 🟡 Intermediate（进阶）

### VIZ-I1｜D3.js 选择集与数据绑定

- **题型**：理论概念题 + 代码分析题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  先解释 D3 中 select 与 selectAll、datum 与 data 的区别；再分析下面代码执行后 DOM 中会新增几个 circle、各自绑定什么数据，并说明 enter/update/exit/merge 各阶段的作用。追问：若第二次把数据换成长度为 5 的数组再执行同样的 join，会发生什么？
  ```js
  const data = [10, 25, 40];
  const svg = d3.select('#svg');
  const circles = svg.selectAll('circle').data(data);
  circles.enter().append('circle')
    .attr('cy', 50)
    .attr('cx', (d, i) => 30 + i * 60)
    .attr('r', d => d / 2)
    .merge(circles)          // 将 enter 集与 update 集合并，统一设置属性
    .attr('fill', 'steelblue');
  ```
- **考察要点**：
  - select/selectAll 两种选择集的粒度差异
  - datum（静态值绑定）与 data（数组按索引或 key 绑定）的区别
  - enter/update/exit 三集的划分与 General Update Pattern
  - merge 的作用与 key 函数在增量更新中的意义
- **参考答案要点**：
  - select 返回第一个匹配节点的选择集，常用于容器级操作；selectAll 返回所有匹配节点的选择集，是批量数据绑定的基础。
  - datum 把同一个静态值绑定到选择集中的每个节点，不产生 enter/exit；data 把数组按索引（或 key 函数）逐一绑定，并据此划分三个子集。
  - 上述代码执行后新增 3 个 circle，分别绑定 10、25、40；初始页面无 circle，数据全部落入 enter 集，update 集为空。
  - enter 集负责"数据多、节点少"时补建节点；update 集是数据与节点都已存在、需更新属性的部分；exit 集是"节点多、数据少"时的冗余节点，必须显式 remove（或过渡移除）。
  - merge 把 enter 集与 update 集合并为一个选择集，避免对两者重复编写相同的属性设置代码。
  - 第二次传入 5 个元素：前 3 个进入 update 集（属性被更新），多出的 2 个进入 enter 集被 append；若数据是对象数组，应传 key 函数 `.data(data, d => d.id)`，按身份复用节点而非按索引错位。

### VIZ-I2｜Three.js 基础 3D 场景搭建

- **题型**：实际场景应用题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  使用 Three.js（ES Modules）搭建一个最小可运行 3D 场景：场景中有一个受光照影响的绿色立方体（环境光 + 平行光），透视相机从斜上方观察它；窗口 resize 时画面不变形；并用 requestAnimationFrame 让立方体缓慢自转。请写出完整代码并解释其中每个对象的职责。
- **考察要点**：
  - Scene / Camera / Renderer / Light / Mesh 五类基本对象的职责划分
  - resize 时相机与渲染器需要同步更新的具体点
  - requestAnimationFrame 渲染循环的意义
- **参考答案要点**：
  - 完整代码如下：
  ```js
  import * as THREE from 'three';

  // 1. 场景：承载所有 3D 对象的根容器
  const scene = new THREE.Scene();

  // 2. 透视相机：视场角、宽高比、近/远裁剪面
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(3, 3, 5);
  camera.lookAt(0, 0, 0);

  // 3. 渲染器：负责 WebGL 上下文与逐帧绘制
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); // 限制 DPR，避免高分屏过度绘制
  document.body.appendChild(renderer.domElement);

  // 4. 光照：环境光提供底色，平行光提供方向性明暗
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  // 5. 立方体网格：几何体 + 材质组合成可渲染对象
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71 }) // PBR 材质，需要光照才可见
  );
  scene.add(cube);

  // 6. 渲染循环：每帧更新姿态并重绘
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();

  // 7. 视口自适应：同步相机宽高比与渲染器尺寸
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  ```
  - Scene 是根容器；PerspectiveCamera 由 fov / aspect / near / far 定义视锥体；WebGLRenderer 创建 WebGL 上下文并把场景逐帧绘制到 canvas。
  - Mesh = Geometry + Material；MeshStandardMaterial 是 PBR 材质，其颜色表现依赖场景中的光照参与。
  - AmbientLight 提供无方向的环境亮度，DirectionalLight 模拟平行光源（如太阳）产生方向性明暗，是立体感的基础。
  - resize 时必须同时更新 camera.aspect 并调用 updateProjectionMatrix()，再同步 renderer.setSize，三者缺一画面就会拉伸变形。
  - 渲染循环用 requestAnimationFrame 而非 setInterval：与浏览器刷新率对齐、页面隐藏时自动暂停、节省功耗。

### VIZ-I3｜ECharts 双 Y 轴柱线混合图

- **题型**：实际场景应用题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  用 ECharts 实现"月度经营看板"图表：x 轴为 1–6 月；柱状图展示收入（万元），折线图展示环比增长率（%）。要求：图例可切换两个系列；左右双 y 轴（左轴收入、右轴百分比）；tooltip 同屏展示两个系列且增长率保留 1 位小数并带 %；底部 dataZoom 支持拖拽筛选月份。请给出完整 option 配置。
- **考察要点**：
  - 多系列图表中 yAxisIndex 与双 y 轴的配置方式
  - tooltip formatter 的自定义数据处理
  - dataZoom 滑块与内置缩放的组合使用
- **参考答案要点**：
  - 完整 option 配置如下：
  ```js
  const months  = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const revenue = [120, 135, 128, 160, 172, 190];      // 收入（万元）
  const growth  = [8.2, 12.5, -5.2, 25.0, 7.5, 10.5];  // 环比增长率（%）

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      // 自定义 formatter：params 是当前触发点的全部系列参数数组
      formatter: (params) => params.map((p) => {
        const isRate = p.seriesName === '环比增长率';
        const value = isRate ? p.value.toFixed(1) : p.value;
        return `${p.marker}${p.seriesName}：${value}${isRate ? '%' : ' 万元'}`;
      }).join('<br/>')
    },
    legend: { data: ['收入', '环比增长率'] },
    xAxis: { type: 'category', data: months },
    yAxis: [
      { type: 'value', name: '收入（万元）' },
      { type: 'value', name: '增长率（%）', axisLabel: { formatter: '{value}%' }, splitLine: { show: false } }
    ],
    dataZoom: [
      { type: 'slider', height: 20, bottom: 8 },        // 底部滑块
      { type: 'inside' }                                // 滚轮/触控板缩放
    ],
    series: [
      { name: '收入', type: 'bar', data: revenue },
      { name: '环比增长率', type: 'line', yAxisIndex: 1, data: growth, smooth: true }
    ]
  });
  ```
  - 双 y 轴在 yAxis 中以数组声明，折线系列通过 yAxisIndex: 1 挂到右轴；两轴必须标注单位，避免读数歧义。
  - 系列默认挂 yAxisIndex 0；百分比轴建议关闭 splitLine，避免与左轴网格线重叠造成视觉干扰。
  - tooltip formatter 接收 axis 触发点的系列参数数组，可统一拼接 HTML 控制格式（如 toFixed(1) + 单位）。
  - dataZoom 的 slider 与 inside 可同时启用；图例 legend.data 与系列名一致即可联动显隐。

## 🔴 Advanced（高级）

### VIZ-A1｜D3.js 力导向关系图的交互式架构设计

- **题型**：架构设计题
- **难度**：Advanced ★★★★★
- **问题描述**：
  基于 D3.js 设计一个"知识图谱/人物关系图"模块：数百级节点与边的力导向布局，支持整体缩放平移（d3-zoom）、节点拖拽（d3-drag）、hover 节点显示 tooltip 并高亮一度关联的节点与边、点击节点更新详情面板，且数据需支持增量更新。请说明代码模块划分、各交互的实现要点与数据更新策略。
- **考察要点**：
  - forceSimulation 力模型配置与布局收敛控制
  - zoom/drag 与模拟 tick 循环的协调方式（transform 应用层、fx/fy 固定坐标）
  - 大规模节点下的事件绑定与高亮策略
  - 基于 key 函数的增量数据更新
- **参考答案要点**：
  - 模块划分：数据层（nodes/links 归一化并建立 id → 节点、节点 → 邻接的索引 Map）、布局层（d3.forceSimulation 力模型）、视图层（SVG 图层结构，zoom 的 transform 统一应用在根 g 上）、交互层（drag/hover/click）、UI 层（tooltip/详情面板），各层通过明确接口通信。
  - 力配置：forceLink（距离/强度）、forceManyBody（斥力）、forceCenter 或 forceX/forceY（居中防漂移）；用 alphaDecay / velocityDecay 控制收敛速度，超大规模可先在 Worker 中预跑 tick 再渲染。
  - 缩放平移：d3.zoom 只负责产出 transform 并应用到根 g 的 transform 属性，节点坐标始终保持模型坐标系；用 scaleExtent 限制范围，tooltip 定位使用 client 坐标避免被缩放矩阵影响。
  - 节点拖拽：drag start 时 simulation.alphaTarget(0.3).restart() 并设置 fx/fy 固定坐标，drag 中更新 fx/fy，end 时视需求置空 fx/fy 并恢复 alphaTarget(0) 让布局重新收敛。
  - hover 高亮：预先建立邻接索引，mouseenter 时按 id 收集一度子图并给对应元素加 class，配合 CSS transition 做视觉反馈；事件委托绑定在容器上，避免逐节点绑事件。
  - 数据更新：节点与边都必须传 key 函数（.data(nodes, d => d.id)）走 General Update Pattern 处理 enter/update/exit；新增节点给初始位置（放在邻居附近）避免全图抖动，更新后调用 simulation.nodes().links() 并以低 alpha 重启。

### VIZ-A2｜Three.js 大型场景渲染优化

- **题型**：实际场景应用题 + 技术选型题
- **难度**：Advanced ★★★★★
- **问题描述**：
  一个 WebGL 数字孪生/园区可视化场景包含数万株植被、数十栋建筑、大量重复材质与高分辨率贴图，低端机上掉帧严重。请给出一套系统性的渲染性能优化策略清单（说明每项的原理与预期收益），并指出哪些优化可以组合、哪些互斥，以及如何先定位瓶颈再对症下药。
- **考察要点**：
  - draw call 与 GPU 负载两类瓶颈的定位思路
  - InstancedMesh / 合并几何体 / LOD / 视锥剔除的适用边界
  - 纹理与渲染器层面的降功耗手段
- **参考答案要点**：
  - 先定位瓶颈：用 Stats 或 Spector 观察 draw call 数、三角面数、帧耗时——CPU 提交瓶颈（draw call 过多）走合批，GPU 负载瓶颈（着色过重）走 LOD/降分辨率/简化材质。
  - InstancedMesh 合批：同一几何体 + 材质的重复物体（植被、路灯）用实例化一次 draw call 绘制，draw call 从 N 降到 1，万级重复物件的收益最显著。
  - 合并几何体：静态且材质相同的零散 mesh 用 BufferGeometryUtils.mergeGeometries 合成大 mesh，减少 draw call 与状态切换；与 InstancedMesh 互补——重复体用实例、异形静态体用合并。
  - LOD：按距离或屏幕占比切换高/低模层级，减少顶点与片段着色开销，适合大范围开放场景。
  - 视锥剔除：Three.js 默认基于包围球自动剔除，但过度合并出超大 mesh 会破坏剔除粒度，需控制合并粒度或手动分块——这也是"合并"与"剔除"之间需要权衡的地方。
  - 纹理优化：用 KTX2/Basis 压缩纹理替代 PNG/JPG（显存与带宽可省数倍）、纹理图集减少绑定切换、合理设置 mip 与各向异性等级。
  - 按需渲染与降功耗：静态场景不必 60fps 空转，仅在交互/动画帧调用 render（on-demand 模式）；setPixelRatio(Math.min(devicePixelRatio, 2))、必要时降分辨率渲染、按需开启阴影与抗锯齿，移动端功耗收益明显。
  - 组合原则：实例化/合并/LOD/压缩纹理可叠加使用，收益相乘；注意合并与剔除粒度、LOD 与实例化的兼容性需要提前设计。

### VIZ-A3｜百万级数据点可视化渲染优化方案

- **题型**：架构设计题 + 实际场景应用题
- **难度**：Advanced ★★★★☆
- **问题描述**：
  时序监控平台需要在前端展示单图 100 万级数据点的曲线（支持缩放、框选、tooltip 查值），且同一页面要渲染几十个此类图表。请设计一套完整的渲染优化方案：从数据侧（降采样）到渲染侧（虚拟滚动、WebGL、Worker、分片调度）分层说明，并给出每层的实施要点。
- **考察要点**：
  - 降采样算法（LTTB / min-max）的原理与适用取舍
  - 虚拟滚动在图表列表场景的适配方式
  - Web Worker 与分片调度对主线程的保护
  - 缩放/查值等交互在降采样后的数据一致性处理
- **参考答案要点**：
  - 数据侧降采样是第一优先级：屏幕分辨率有限，先降采样再渲染。LTTB（Largest-Triangle-Three-Buckets）按"三角形面积最大"选点，能在数千桶内保留曲线形状与峰谷特征；min-max 降采样每个桶保留极值，保证告警峰值不丢。
  - 缩放联动：dataZoom/视窗变化时按当前范围重新降采样（可在 Worker 或服务端聚合），实现"缩得越深、细节越多"，并按缩放层级缓存结果。
  - 渲染侧：单条海量曲线用 WebGL 批量绘制（ECharts GL、regl 或自建 shader），顶点一次性提交 GPU，避免 Canvas 2D 逐点绘制的 CPU 瓶颈；纯 DOM/SVG 方案在此量级不可行。
  - 列表层虚拟滚动：几十个图表只渲染视口内的可见图表（react-window 思路），不可见的销毁实例或留占位，使 DOM 与实例数量只与视口相关、与数据总量无关。
  - 计算下放 Web Worker：统计聚合、降采样、框选计算移入 Worker，主线程只做渲染；大数组用 Transferable（ArrayBuffer）传输，避免结构化克隆的开销。
  - 分片渲染与 rAF 调度：首屏只画可视区间，其余图表用 requestIdleCallback / requestAnimationFrame 分片初始化；单帧工作量超过预算（如 8ms）就让出主线程，保证交互优先。
  - 交互细节：tooltip 查值用二分或预建索引而非遍历；框选统计在 Worker 完成；降采样后展示"已抽稀"提示保证数据诚实。
  - 验收指标：FPS、长任务数（PerformanceObserver）、内存占用，防止优化引入隐性回归。

### VIZ-A4｜ECharts 自定义系列与扩展组件开发

- **题型**：架构设计题
- **难度**：Advanced ★★★★★
- **问题描述**：
  产品要求在现有 ECharts 看板中新增一种官方没有的"阶梯热力带 + 阈值标记"图表，且必须与 tooltip、legend、dataZoom、坐标系正常联动。请基于 ECharts 的扩展机制（自定义系列 renderItem、echarts.registerLayout、registerMap 等）说明：开发一个自定义图表类型的完整步骤、坐标系适配方法与性能注意点。
- **考察要点**：
  - renderItem / registerLayout / registerMap 三种扩展机制的分工
  - 数据坐标到像素坐标的转换（api.coord / api.size）
  - 自定义系列与 tooltip、legend、dataZoom 的联动接入
  - renderItem 高频调用下的性能约束
- **参考答案要点**：
  - 先评估降级方案：能否用 markLine/markArea、visualMap 或系列堆叠组合近似实现；确认不可行再走 custom series，维护成本差异巨大。
  - custom series 的核心是 renderItem(params, api) 回调：用 api.value() 读数据项、api.coord() 把数据坐标换算为像素坐标、api.size() 获取轴上单位数值对应的像素长度，返回 group/rect/polygon 等图形描述对象。
  - 坐标系适配：renderItem 自动运行在所属 grid/polar 等坐标系中，必须用 api.coord 换算而非硬编码像素，dataZoom 缩放与 resize 才能正确联动；需要自定义布局阶段时才用 echarts.registerLayout 对已有系列坐标做二次加工（如流图、标签防重叠），地图扩展用 echarts.registerMap 注册 GeoJSON。
  - 交互接入：自定义图形上声明对应的数据索引后，tooltip、emphasis 高亮、click 等事件与内置系列行为一致；图例联动通过系列名与 legend.data 关联。
  - 开发步骤：定义 option 约定（数据结构、编码映射）→ 实现 renderItem 生成图形 → 用 api.style() 继承默认样式与 emphasis → 处理 clip 剪裁与 visualMap 映射 → 封装成可复用的 option 生成器组件并补类型定义与快照测试。
  - 性能注意：renderItem 在每次布局/缩放时会对每个数据项调用一次，回调内禁止创建大对象与重复计算，预计算放在数据侧；大数据量开启 large 模式或改用 canvas 渲染，并尽量减少返回的图形元素数量。

---

## 📌 本领域高频考点速记

- Canvas 是即时模式位图，SVG 是保留模式 DOM 图元；选型看"图元数量 × 刷新频率 × 交互精细度"。
- SVG 原生 DOM 事件与 pointer-events；Canvas 需自行命中检测（isPointInPath 或场景图库）。
- ECharts 三板斧：init 有宽高的容器 → setOption 增量配置 → resize/dispose；renderer 可选 canvas/svg。
- D3 General Update Pattern：data(d => d.id) 划分 enter/update/exit，merge 合并统一更新，exit 必须 remove。
- D3 力导向图：simulation + tick 驱动；zoom 的 transform 应用在根 g；drag 用 fx/fy 固定坐标。
- Three.js 五件套：Scene、Camera、Renderer、Light、Mesh；resize 需同步 aspect + updateProjectionMatrix + setSize。
- 大场景优化优先级：InstancedMesh/合并几何体降 draw call → 压缩纹理（KTX2）省显存 → LOD + 视锥剔除 → 按需渲染降功耗。
- 海量点线先降采样再渲染：LTTB 保形状、min-max 保极值，缩放时按视窗重算。
- 主线程保卫战：统计/降采样进 Worker（Transferable 传输），渲染分片 + rAF 调度，首屏优先。
- ECharts 扩展三板斧：custom series 的 renderItem 画自定义图形、registerLayout 改布局、registerMap 注册地图。
