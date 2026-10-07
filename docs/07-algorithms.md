# 七、数据结构与算法

> 数据结构与算法是前端工程师的「内功」：它决定了对代码性能边界的判断力与复杂问题的拆解能力。在 AI 时代，AI 可以帮你生成大量代码，但选哪种数据结构、复杂度是否可控、边界是否正确，仍需要工程师自己把关。本领域以手写排序、查找、二叉树等经典题为基础，延伸到优先队列、LRU 等工程级结构与前端真实性能场景。

**题量分布**：Basic 4 题 · Intermediate 4 题 · Advanced 3 题（共 11 题）

**🎬 配套漫画**：[EP.07 排序复杂度之旅](../comics/ep07-algo-sorting.svg)

---

## 🟢 Basic（基础）

### ALGO-B1｜时间复杂度与空间复杂度：读懂大 O 记号

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请解释什么是时间复杂度与空间复杂度，大 O 记号为什么可以忽略常数项与低阶项？请按增长速度从慢到快排列 O(1)、O(n)、O(log n)、O(n log n)、O(n²)，并以冒泡排序为例说明什么是最好情况、最坏情况与平均情况复杂度。
- **考察要点**：
  - 理解大 O 描述的是随输入规模 n 增长的趋势上界，而非精确运行时间
  - 能正确排序常见复杂度：O(1) < O(log n) < O(n) < O(n log n) < O(n²)
  - 理解最好/最坏/平均情况的区别与工程意义（最坏情况保证性能下限）
  - 知道空间复杂度要计入临时数组与递归调用栈
- **参考答案要点**：
  - 大 O 记号表示算法耗时（或占用空间）随输入规模 n 增长的上界趋势；当 n 足够大时，低阶项（如 O(n² + n) 中的 n）与常数因子对趋势影响可忽略，故记为 O(n²)
  - 增长速度从慢到快：O(1) < O(log n) < O(n) < O(n log n) < O(n²)
  - 最好情况：输入已是最优排列，如对有序数组做带提前退出的冒泡一轮即完成，O(n)；最坏情况：完全逆序，O(n²)；平均情况：随机输入下的期望复杂度，冒泡仍为 O(n²)
  - 工程上通常关注最坏情况（性能保证下限）与平均情况（期望性能）；面试中若不特别说明，说的时间复杂度默认指最坏情况
  - 空间复杂度同理：原地排序为 O(1)；归并排序需要 O(n) 辅助数组；递归算法要计入调用栈深度，如平衡二叉树遍历的递归空间为 O(log n)

### ALGO-B2｜冒泡排序原理与提前退出优化

- **题型**：理论概念题 + 代码分析题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请描述冒泡排序的基本原理，说明「提前退出」优化（flag 标记）为什么有效、优化后最好情况复杂度是多少。阅读以下代码，写出对 `[5, 1, 4, 2, 8]` 每一轮（外层循环一次）结束后的数组状态：

```js
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false; // 本轮是否发生交换
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; // 交换相邻元素
        swapped = true;
      }
    }
    if (!swapped) break; // 一轮未交换说明已有序，提前退出
  }
  return arr;
}
```

- **考察要点**：
  - 理解「相邻比较、大数右浮」的过程与每轮结果的确定性
  - 理解 flag 优化的依据：某轮无交换说明整体有序，可提前终止
  - 能手工模拟每轮状态，验证对算法的真实理解
  - 知道内层边界 `n - 1 - i` 的含义：尾部已排好序的区域不再参与比较
- **参考答案要点**：
  - 原理：从头开始两两比较相邻元素，逆序则交换，每一轮把未排序部分的最大值「冒泡」到末尾
  - flag 优化：若某一整轮没有任何交换，说明数组已完全有序，后续轮次不会发生变化，直接 break；优化后对「原本有序」输入的最好情况为 O(n)，未优化版本仍要跑满 n-1 轮，为 O(n²)
  - 每轮结果（输入 `[5, 1, 4, 2, 8]`）：
    - 第 1 轮：`[1, 4, 2, 5, 8]`（5 依次与 1、4、2 交换后停在 8 前）
    - 第 2 轮：`[1, 2, 4, 5, 8]`（4 与 2 交换）
    - 第 3 轮：无交换，flag 触发 break，算法提前结束，结果 `[1, 2, 4, 5, 8]`
  - 复杂度：平均/最坏时间 O(n²)，最好（优化后）O(n)；空间 O(1)；相邻交换保证它是稳定排序
  - 内层 `j < n - 1 - i` 随 i 递减，因为每轮结束后的尾部元素已就位

### ALGO-B3｜手写二分查找：循环不变量与边界陷阱

- **题型**：代码实现题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请手写二分查找：给定升序整数数组 `nums` 与目标值 `target`，若存在返回其下标，否则返回 `-1`。要求实现 `function binarySearch(nums, target) {...}`，并解释循环不变量是什么、`mid` 为什么写成 `left + ((right - left) >> 1)`，以及初学者常见的边界错误有哪些。
- **考察要点**：
  - 掌握左闭右闭区间写法及配套的 `left <= right` 与 `right = mid - 1`
  - 能清晰表述循环不变量：target 若存在必在 [left, right] 内
  - 理解 `left + ((right - left) >> 1)` 的意义：取整方式确定且不受超大值相加的溢出/精度影响
  - 能指出常见错误：条件与边界更新不配套、mid 未取整导致死循环或越界
- **参考答案要点**：

```js
function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1; // 搜索区间为闭区间 [left, right]
  while (left <= right) {
    // 用偏移 + 右移取整：等价于 floor((left+right)/2)，且不受超大值相加影响
    const mid = left + ((right - left) >> 1);
    if (nums[mid] === target) {
      return mid; // 命中目标
    } else if (nums[mid] < target) {
      left = mid + 1; // 目标只可能在右半区间
    } else {
      right = mid - 1; // 目标只可能在左半区间
    }
  }
  return -1; // 区间为空，目标不存在
}
```

  - 循环不变量：整个循环过程中「若 target 存在，则必在 [left, right] 内」始终成立；每轮排除一半区间，终止时区间为空即不存在
  - 前提：数组必须有序（本题升序），无序时结果不可预期；空数组时 right = -1，循环不进入，直接返回 -1
  - 复杂度：时间 O(log n)，空间 O(1)
  - 常见边界错误：① 循环条件写 `left < right` 却不处理退出后的最后一格，漏查单元素区间；② 更新写成 `right = mid`，与 `>>` 向下取整配合可能在两元素区间死循环；③ JS 特有：`mid = (left + right) / 2` 得到小数，`nums[mid]` 为 undefined；④ 三种区间口径（闭/左闭右开/开）混用，条件与边界更新不配套
  - 记忆口诀：闭区间配 `left <= right` 与 `mid ± 1`；口径一旦选定，全篇保持一致

### ALGO-B4｜二叉树前/中/后序遍历（递归与迭代）

- **题型**：代码实现题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  给定二叉树节点定义 `function TreeNode(val) { this.val = val; this.left = null; this.right = null; }`，请实现前序、中序、后序遍历并返回节点值数组。要求：① 三种遍历都给出递归实现；② 至少给出一种迭代实现（如中序遍历的显式栈版本）；③ 分别说明三种遍历的访问顺序定义与复杂度。
- **考察要点**：
  - 准确说出三种遍历定义：前序「根左右」、中序「左根右」、后序「左右根」
  - 递归版结构一致性：仅「访问根」的时机不同
  - 迭代版用显式栈模拟递归，理解「沿左链入栈 → 弹出访问 → 转向右子树」
  - 知道递归受 JS 调用栈深度限制，深层树需迭代实现
- **参考答案要点**：

```js
function TreeNode(val) {
  this.val = val;
  this.left = null;
  this.right = null;
}

// ---------- 递归版 ----------
function preorder(root, res = []) {
  if (!root) return res; // 空节点直接返回
  res.push(root.val); // 1. 访问根
  preorder(root.left, res); // 2. 遍历左子树
  preorder(root.right, res); // 3. 遍历右子树
  return res;
}

function inorder(root, res = []) {
  if (!root) return res;
  inorder(root.left, res); // 1. 遍历左子树
  res.push(root.val); // 2. 访问根
  inorder(root.right, res); // 3. 遍历右子树
  return res;
}

function postorder(root, res = []) {
  if (!root) return res;
  postorder(root.left, res); // 1. 遍历左子树
  postorder(root.right, res); // 2. 遍历右子树
  res.push(root.val); // 3. 访问根
  return res;
}

// ---------- 迭代版（中序，显式栈） ----------
function inorderIterative(root) {
  const res = [];
  const stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) {
      stack.push(cur); // 一路向左，沿途节点入栈
      cur = cur.left;
    }
    cur = stack.pop(); // 栈顶：左子树已处理完的节点
    res.push(cur.val); // 访问它
    cur = cur.right; // 转向右子树，重复上述过程
  }
  return res;
}
```

  - 访问顺序：前序 = 根 → 左 → 右；中序 = 左 → 根 → 右；后序 = 左 → 右 → 根；二叉搜索树的中序结果是有序序列
  - 三个递归版仅 `res.push` 位置不同，结构完全一致，便于记忆
  - 迭代中序不变量：栈中节点都是「左子树尚未完全处理」的祖先链，弹出即代表该节点左子树已完毕
  - 复杂度：时间均为 O(n)（每节点进出栈一次）；空间 O(h)，h 为树高——递归用调用栈，迭代用显式栈，后者不受 JS 调用栈深度限制
  - 追问延伸：前序迭代用「先压右再压左」；后序迭代可用「前序变形（根右左）+ 结果反转」

## 🟡 Intermediate（进阶）

### ALGO-I1｜手写快速排序：partition、随机基准与最坏情况分析

- **题型**：代码实现题
- **难度**：Intermediate ★★★★☆
- **问题描述**：
  请手写快速排序 `function quickSort(arr, left = 0, right = arr.length - 1) {...}`（原地排序）。要求：① 实现 partition 分区（说明基准如何选取、如何返回基准最终位置）；② 加入随机基准并解释为什么需要它；③ 分析平均 O(n log n)、最坏 O(n²) 的成因，并给出工程上规避最坏情况的手段。
- **考察要点**：
  - 理解 partition 的不变量：基准左侧全部小于它，右侧全部不小于它
  - 能推导最坏情况：每次基准恰好是最值，分区极度不平衡退化 O(n²)
  - 理解随机基准让「最坏输入」与「基准选择」解耦，期望复杂度回到 O(n log n)
  - 了解三数取中、小区间转插入排序、三路快排等工程优化
- **参考答案要点**：

```js
function partition(arr, left, right) {
  // 随机选基准并与左端交换，防止有序/近有序输入退化为 O(n²)
  const randIdx = left + Math.floor(Math.random() * (right - left + 1));
  [arr[left], arr[randIdx]] = [arr[randIdx], arr[left]];

  const pivot = arr[left]; // 基准值
  let i = left + 1; // i：下一个「小于基准」的元素应存放的边界
  for (let j = left + 1; j <= right; j++) {
    if (arr[j] < pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]]; // 维持 [left+1, i) 均小于基准
      i++;
    }
  }
  [arr[left], arr[i - 1]] = [arr[i - 1], arr[left]]; // 基准归位
  return i - 1; // 返回基准最终下标
}

function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return arr; // 区间长度 <= 1，天然有序
  const pivot = partition(arr, left, right); // 分区，拿到基准最终位置
  quickSort(arr, left, pivot - 1); // 递归排左半区
  quickSort(arr, pivot + 1, right); // 递归排右半区
  return arr;
}
```

  - partition 不变量：循环任意时刻 [left+1, i) 都小于 pivot、[i, j) 都不小于 pivot；结束后基准归位于 i-1，两侧天然有序可分治
  - 复杂度：每轮分区 O(区间长度)；若每次大致对半，递归深度 O(log n)，总计 O(n log n)；若每次基准都是最值（如对完全有序数组固定取左端），一侧只剩 n-1 个元素，递归 n 层，比较总量 n² 级，退化为 O(n²)，且递归栈深 O(n)
  - 随机基准：把「输入分布」与「基准选择」解耦，任何固定输入的最坏情况概率趋近于零，期望 O(n log n)；同思路的还有三数取中（首/中/尾取中位数）
  - 其他工程手段：小区间（如长度 < 16）转插入排序减少递归开销；先递归较小一侧控制栈深；大量重复元素用三路快排（< = > 三分区），否则全等数组也会退化
  - 快排不稳定，需要稳定排序时应使用语言内置 sort（TimSort）；JS 中溢出不是问题（Number 为浮点），但 `>> 1` 类取整习惯从其他语言迁移时依然推荐

### ALGO-I2｜堆排序与 TopK：为什么「前 K 大」用小顶堆

- **题型**：代码实现题 + 实际场景应用题
- **难度**：Intermediate ★★★★☆
- **问题描述**：
  实际场景：电商页面需要展示实时销量 Top 10 商品，销量数据持续到达，且只允许维护与 K 同阶的内存结构。请：① 手写堆排序（建堆 + 下沉调整）；② 用小顶堆实现「求无序数组前 K 大元素」的 `function topK(nums, k) {...}`，并解释为什么求前 K 大反而用小顶堆；③ 对比堆排序与小顶堆 TopK 在数据流场景下的复杂度差异。
- **考察要点**：
  - 掌握堆的数组表示：节点 i 的左孩子 2i+1、右孩子 2i+2、父节点 (i-1) >> 1
  - 理解下沉（siftDown）调整与自底向上建堆 O(n)
  - 能解释 TopK 的「门槛」直觉：小顶堆顶是当前 K 个中最小的
  - 知道数据流场景维护 K 大小顶堆为 O(n log K)，优于全量排序 O(n log n)
- **参考答案要点**：

```js
// ---------- 堆排序 ----------
function heapSort(arr) {
  const n = arr.length;
  // 自底向上建大顶堆：从最后一个非叶子节点开始下沉
  for (let i = (n >> 1) - 1; i >= 0; i--) {
    siftDown(arr, i, n);
  }
  // 依次把堆顶（最大值）换到末尾，再对剩余前缀重新下沉
  for (let end = n - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]]; // 当前最大值归位
    siftDown(arr, 0, end); // 堆的有效大小缩为 end
  }
  return arr;
}

// 在 [0, size) 内让下标 i 的元素下沉到正确位置（大顶堆）
function siftDown(arr, i, size) {
  while (true) {
    const left = 2 * i + 1; // 左孩子下标
    if (left >= size) break; // 没有孩子，调整结束
    let larger = left;
    const right = left + 1;
    if (right < size && arr[right] > arr[left]) larger = right; // 选较大孩子
    if (arr[i] >= arr[larger]) break; // 已满足堆性质
    [arr[i], arr[larger]] = [arr[larger], arr[i]]; // 与较大孩子交换
    i = larger; // 继续向下
  }
}

// ---------- TopK（前 K 大 → 维护大小为 K 的小顶堆） ----------
function topK(nums, k) {
  const heap = [];
  for (const num of nums) {
    if (heap.length < k) {
      heapPush(heap, num); // 堆未满，直接入堆
    } else if (num > heap[0]) {
      heapPop(heap); // 新元素大于门槛（堆顶），挤掉堆顶
      heapPush(heap, num);
    }
  }
  return heap; // 堆内即前 K 大（顺序不代表排名）
}

function heapPush(heap, val) {
  heap.push(val);
  let i = heap.length - 1;
  while (i > 0) {
    const parent = (i - 1) >> 1; // 父节点
    if (heap[i] >= heap[parent]) break; // 小顶堆：比父大即停
    [heap[i], heap[parent]] = [heap[parent], heap[i]];
    i = parent;
  }
}

function heapPop(heap) {
  const top = heap[0];
  const last = heap.pop(); // 取出尾元素
  if (heap.length) {
    heap[0] = last; // 尾元素补到堆顶
    let i = 0;
    while (true) {
      const left = 2 * i + 1;
      if (left >= heap.length) break;
      let smaller = left;
      const right = left + 1;
      if (right < heap.length && heap[right] < heap[left]) smaller = right;
      if (heap[i] <= heap[smaller]) break; // 小顶堆：比孩子中最小的小即停
      [heap[i], heap[smaller]] = [heap[smaller], heap[i]];
      i = smaller;
    }
  }
  return top;
}
```

  - 「前 K 大」用小顶堆的直觉：小顶堆顶是堆内 K 个元素中最小的，即当前 TopK 的「准入门槛」；只有比门槛大的新元素才有资格替换它。若用大顶堆，堆顶是全局最大，无法判断「谁该被淘汰」
  - 复杂度对比：TopK 每个元素最多一次 pop + push，各 O(log K)，总计 O(n log K)、空间 O(K)；堆排序处理全部 n 个元素，O(n log n)、原地 O(1) 空间
  - 数据流适配：数据持续到达且 K 固定时，小顶堆无需保留历史数据、内存可控，正合「实时销量 Top 10」需求；堆排序则要求一次性拿到全量数据
  - 边界推演：k = 0 返回空堆；k ≥ n 时堆内即全部元素；`num > heap[0]` 用严格大于，相等元素不重复替换
  - 工程补充：JS 无内置堆，需自实现（如上）或引优先队列库；K 极小（如 Top 3）时直接遍历维护 K 个变量更简单

### ALGO-I3｜二叉树经典三连：翻转、最大深度、最近公共祖先

- **题型**：代码实现题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  基于题 ALGO-B4 的 `TreeNode` 定义，实现以下三个函数：① `invertTree(root)` 翻转二叉树（镜像）；② `maxDepth(root)` 求最大深度；③ `lowestCommonAncestor(root, p, q)` 求两节点在普通二叉树（非 BST）中的最近公共祖先。要求给出完整可运行代码，并逐一说明时间/空间复杂度。
- **考察要点**：
  - 递归分解问题：翻转 = 交换左右孩子后递归翻转两棵子树
  - 最大深度 = 1 + max(左深度, 右深度)，理解自底向上聚合
  - LCA 的递归判定：左右子树分别查找，p、q 分居两侧则当前节点即答案
  - 统一「先写空节点出口，再拼子问题答案」的递归套路与复杂度分析
- **参考答案要点**：

```js
// ① 翻转二叉树（镜像）
function invertTree(root) {
  if (!root) return null; // 出口：空树
  [root.left, root.right] = [root.right, root.left]; // 交换左右孩子
  invertTree(root.left); // 递归翻转左子树
  invertTree(root.right); // 递归翻转右子树
  return root;
}

// ② 最大深度
function maxDepth(root) {
  if (!root) return 0; // 出口：空节点深度为 0
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right)); // 自底向上聚合
}

// ③ 最近公共祖先（普通二叉树）
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root; // 命中 p/q 或走到空
  const left = lowestCommonAncestor(root.left, p, q); // 左子树里找
  const right = lowestCommonAncestor(root.right, p, q); // 右子树里找
  if (left && right) return root; // p、q 分居两侧，当前节点即 LCA
  return left || right; // 否则返回非空一侧（可能在同侧更深处）
}
```

  - 翻转：时间 O(n)（每节点访问一次），空间 O(h) 递归栈；翻转后中序遍历结果恰好反转
  - 最大深度：时间 O(n)，空间 O(h)；也可用 BFS 层序遍历按层计数得到深度
  - LCA：时间 O(n)，空间 O(h)；前提是 p、q 都在树中，否则需先校验存在性再套用该模板
  - LCA 推演要点：命中 p 或 q 就提前返回，不再向下找；`left && right` 成立时当前节点一定是「最深的分叉点」
  - 递归思维模板：先写最小问题出口（空节点），再写「如何用子问题答案拼出当前答案」；树 diff、JSON 结构变换中是同款套路

### ALGO-I4｜排序算法稳定性与工程选型：为什么 V8 的 sort 用 TimSort

- **题型**：技术选型题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  请：① 解释什么是排序算法的「稳定性」，并用表格对比冒泡、插入、快排、归并、堆排序的平均时间复杂度、最坏时间复杂度、空间复杂度与稳定性；② 说明为什么 V8 的 `Array.prototype.sort` 采用 TimSort（归并 + 插入的混合排序）；③ 在什么场景下仍会手动选择快排或堆排序而不是内置 sort。
- **考察要点**：
  - 理解稳定性定义：相等元素排序后相对次序不变，及其对多字段叠加排序的意义
  - 能准确填写各排序的复杂度/稳定性对照表
  - 理解 TimSort 动机：真实数据局部有序，run 检测 + 二分插入 + 归并可趋近 O(n)
  - 知道手动实现快排/堆排的适用边界，以及 JS 数字排序必须传比较器
- **参考答案要点**：
  - 稳定性：排序后值相等的元素保持原有相对顺序；工程意义：可叠加排序（先按销量排再稳定地按价格排）、列表排序不打乱相等项的展示顺序
  - 对照表：

| 排序 | 平均时间 | 最坏时间 | 空间 | 稳定性 |
| --- | --- | --- | --- | --- |
| 冒泡 | O(n²) | O(n²) | O(1) | ✅ 稳定 |
| 插入 | O(n²) | O(n²) | O(1) | ✅ 稳定 |
| 快排 | O(n log n) | O(n²) | O(log n)（递归栈） | ❌ 不稳定 |
| 归并 | O(n log n) | O(n log n) | O(n) | ✅ 稳定 |
| 堆排序 | O(n log n) | O(n log n) | O(1) | ❌ 不稳定 |

  - TimSort = 归并 + 插入的混合：将数组切分为天然有序的 run，短 run 用二分插入排序补齐到最小 run 长度，再按规则栈归并；对部分有序的真实数据可趋近 O(n)，最坏 O(n log n) 且稳定
  - V8 选 TimSort 的原因：① ES2019 起规范要求 sort 稳定，TimSort 天然满足；② 避免 Quicksort 在特定输入（早期 V8 曾因此被构造出 O(n²) 攻击）下的退化；③ 真实业务数据常有局部有序性，能吃到 O(n) 红利
  - 仍手动选快排/堆排的场景：教学与面试（理解原理）；内存极敏感的大数据场景选堆排（O(1) 空间）；已知数据近似有序时插入排序极快；大量重复键选三路快排；超大数值数组可考虑计数/桶排序等非比较排序突破 O(n log n) 下界
  - 业务代码结论：优先 `arr.sort(cmp)`；注意 `sort()` 默认按字符串 Unicode 码位比较，数字必须传比较器 `(a, b) => a - b`，且比较器需满足自洽（否则结果未定义）

## 🔴 Advanced（高级）

### ALGO-A1｜手写最小堆与优先队列：siftUp / siftDown 完整实现

- **题型**：代码实现题
- **难度**：Advanced ★★★★★
- **问题描述**：
  请基于数组实现优先队列类 `MinPriorityQueue`，要求：① `push(value, priority)` 入队并上浮；② `pop()` 取出优先级最小的元素并下沉；③ `peek()` 查看堆顶；④ `size` 属性；⑤ 内部封装 `siftUp` 与 `siftDown`。给出完整代码并分析各操作复杂度，最后说明优先队列在前端的典型应用。
- **考察要点**：
  - 堆的数组表示与下标换算：parent = (i-1) >> 1，left = 2i+1
  - 上浮/下沉的方向与终止条件，保证操作后堆性质不被破坏
  - pop 的经典实现：尾元素补堆顶再下沉，避免整体搬移数组
  - 理解优先队列与先进先出队列的语义差异及前端工程用途
- **参考答案要点**：

```js
class MinPriorityQueue {
  constructor() {
    this.heap = []; // heap[i] = { value, priority }
  }
  get size() {
    return this.heap.length;
  }
  peek() {
    return this.heap[0]?.value ?? null; // 堆顶即最小优先级元素
  }
  push(value, priority = value) {
    this.heap.push({ value, priority }); // 先插到尾部
    this.siftUp(this.heap.length - 1); // 再上浮到正确位置
  }
  pop() {
    if (!this.heap.length) return null; // 空堆防御
    const top = this.heap[0];
    const last = this.heap.pop(); // 取出尾元素
    if (this.heap.length) {
      this.heap[0] = last; // 尾元素补到堆顶
      this.siftDown(0); // 下沉恢复堆性质
    }
    return top.value;
  }
  siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1; // 父节点下标
      if (this.heap[i].priority >= this.heap[parent].priority) break; // 已满足小顶堆
      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
    }
  }
  siftDown(i) {
    const n = this.heap.length;
    while (true) {
      const left = 2 * i + 1; // 左孩子
      if (left >= n) break; // 无孩子即止
      let smaller = left;
      const right = left + 1;
      if (right < n && this.heap[right].priority < this.heap[left].priority) smaller = right;
      if (this.heap[i].priority <= this.heap[smaller].priority) break; // 不比孩子大即止
      [this.heap[i], this.heap[smaller]] = [this.heap[smaller], this.heap[i]];
      i = smaller;
    }
  }
}
```

  - 复杂度：push = 尾插 O(1) + 上浮至多 O(log n)；pop = 取顶 + 尾部补位 + 下沉 O(log n)；peek O(1)；自底向上建 n 元素堆为 O(n)，逐个 push 建堆为 O(n log n)
  - 边界推演：空堆 pop 返回 null；仅一个元素时 pop 后堆为空、不再下沉；上浮/下沉的比较符号（`>=` / `<=`）写反会导致死循环或乱序，需脑内推演两元素交换
  - 对称性记忆：小顶堆上浮「比父小才换」，下沉「比较小孩子大才换」；大顶堆方向相反
  - 前端应用：按过期时间调度的任务队列（React Scheduler 同款思路）、失败重试的下次执行时间排序、限流令牌按过期弹出、消息合并时按时间取最早
  - 若需支持运行中修改优先级（decrease-key），要额外维护「值 → 堆下标」的哈希表，定位后上浮/下沉仍为 O(log n)

### ALGO-A2｜LRU 缓存：哈希表 + 双向链表的 O(1) 设计

- **题型**：代码实现题
- **难度**：Advanced ★★★★★
- **问题描述**：
  设计并实现 LRU（Least Recently Used，最近最少使用）缓存类 `LRUCache`，要求：① `get(key)` 命中返回值并提升为最近使用，未命中返回 -1；② `put(key, value)` 写入键值，容量超限时淘汰最久未使用的键；③ `get` 与 `put` 均为 O(1)；④ 说明经典实现（哈希表 + 双向链表）中各部件的分工，并给出基于 JS `Map` 有序性的简化实现，解释它为什么同样成立。
- **考察要点**：
  - 理解 LRU 语义：get 与 put 都算「使用」，淘汰的是最久未被访问的键
  - 哈希表负责 O(1) 定位，双向链表负责 O(1) 移动/删除/插入，两者互补
  - 掌握哑头哑尾哨兵节点简化边界处理的技巧
  - 知道 JS Map 按插入序迭代，配合「删了再插」即可等价模拟 LRU
- **参考答案要点**：

```js
// ---------- 经典实现：哈希表 + 双向链表 ----------
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key -> 节点，O(1) 定位
    // 哑头/哑尾哨兵：head.next 是最旧，tail.prev 是最新
    this.head = { key: null, val: null, prev: null, next: null };
    this.tail = { key: null, val: null, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  _remove(node) { // 从链表摘除节点
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
  _addToTail(node) { // 插到尾部 = 最近使用
    node.prev = this.tail.prev;
    node.next = this.tail;
    this.tail.prev.next = node;
    this.tail.prev = node;
  }
  get(key) {
    const node = this.map.get(key);
    if (!node) return -1;
    this._remove(node); // 摘下
    this._addToTail(node); // 提升为最新
    return node.val;
  }
  put(key, value) {
    const node = this.map.get(key);
    if (node) {
      node.val = value; // 已存在：更新值并提升
      this._remove(node);
      this._addToTail(node);
      return;
    }
    if (this.map.size >= this.capacity) {
      const oldest = this.head.next; // 最久未使用
      this._remove(oldest);
      this.map.delete(oldest.key); // 哈希表同步删除
    }
    const fresh = { key, val: value, prev: null, next: null };
    this.map.set(key, fresh);
    this._addToTail(fresh);
  }
}

// ---------- 简化实现：利用 Map 的插入序 ----------
class LRUCacheSimple {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // Map 记住插入顺序：首项最旧，末项最新
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key); // 删除旧位置
    this.map.set(key, val); // 重新插入到末尾 = 最近使用
    return val;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key); // 先删保证顺序更新
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      // 迭代顺序即插入顺序，第一个 key 就是最久未使用的
      this.map.delete(this.map.keys().next().value);
    }
  }
}
```

  - 经典版分工：哈希表 `key → 链表节点` 实现 O(1) 查找；双向链表按使用时间排列，头部最旧、尾部最新；命中即「摘下 → 移到尾部」，淘汰即「删头部节点 + 删哈希表项」
  - 必须双向链表的原因：O(1) 摘除任意节点需要前驱指针，单向链表找前驱要遍历，退化为 O(n)；哨兵节点让「空缓存/单节点」不再需要特判头尾
  - Map 版成立的原因：ES 规范规定 Map 按插入顺序迭代，`delete + set` 等价于「移到尾部」，`keys().next().value` 等价于「链表头」，语义完全对齐
  - 边界注意：put 已存在的 key 必须先 delete 再 set，否则顺序不更新；get 未命中绝不能触碰顺序；capacity ≤ 0 建议直接抛错
  - 复杂度：两种实现 get/put 均摊 O(1)；经典版常数略大但暴露了可迁移到任意语言的结构，Map 版更简洁——面试建议先写经典版再给简化版
  - 前端落地：内存级请求结果缓存、图片缓存上限控制、路由组件 keep-alive 的 LRU 思想

### ALGO-A3｜算法在前端工程中的真实落地：从虚拟滚动到树 diff

- **题型**：实际场景应用题
- **难度**：Advanced ★★★★☆
- **问题描述**：
  请从以下前端工程场景中至少选取 3 个，逐一说明「遇到了什么性能问题 → 用了什么数据结构/算法 → 为什么是这个算法（复杂度或性质优势）」：① 长列表虚拟滚动要根据 scrollTop 快速定位起始渲染索引；② React/Vue 列表更新时的子节点 diff，Vue 3 引入最长递增子序列（LIS）优化；③ React 时间分片按优先级调度的任务队列；④ 深拷贝/对象合并时处理循环引用；⑤ 富文本编辑器根据光标位置快速定位文本节点。
- **考察要点**：
  - 能把具体性能瓶颈抽象成经典算法问题，而不是背结论
  - 虚拟滚动：单调偏移数组上的定位问题，二分 O(log n) 对比每帧线性扫描 O(n)
  - 树 diff：键映射哈希表实现节点复用，LIS 最小化 DOM 移动
  - 时间分片选最小堆、循环引用选哈希表的「问题 → 结构」映射思维
- **参考答案要点**：
  - ① 虚拟滚动：行高一致时可直接算术定位；动态行高时维护「每行顶部偏移」前缀和数组（单调递增），对 scrollTop 做二分查找定位起始索引，10 万行从每帧 O(n) 扫描降到 O(log n)，且偏移表可增量更新
  - ② 树 diff：先用 Map（旧节点 key → 旧索引）建立 O(1) 的复用查找，解决「旧列表找节点」从 O(n²) 双重循环降为 O(n)；Vue 2 用双端比较（头尾四指针交叉对比）减少移动，Vue 3 在「新列表中可复用节点的索引序列」上求最长递增子序列，让 LIS 命中的节点完全不动、只移动其余节点，DOM 操作次数最少
  - ③ React 时间分片：Scheduler 维护按过期时间（优先级）排序的小顶堆任务队列，每帧 pop 最紧急任务执行一个时间片，超时让出主线程，实现可中断的并发渲染——选堆是因为「反复取当前最优先任务」正是堆的 O(log n) 强项
  - ④ 深拷贝循环引用：递归拷贝时用 WeakMap 记录「原对象 → 拷贝对象」，再次遇到已有引用直接返回缓存，既防无限递归爆栈，又保持引用一致性；选 WeakMap 是因为键为弱引用，不阻止原对象被 GC
  - ⑤ 富文本定位：按行/块维护起始偏移索引（或行内偏移缓存），对光标偏移二分定位所在行，再在行内定位节点，把 O(n) 遍历降为对数级
  - 规律总结：有序数据定位选二分；序列对齐与复用选哈希映射 + LIS；调度选堆；去环与引用共享选 Map/WeakMap——前端性能优化的本质是把业务问题映射到合适数据结构

---

## 📌 本领域高频考点速记

- 大 O 是增长趋势不是精确耗时；O(1) < O(log n) < O(n) < O(n log n) < O(n²)
- 冒泡加 flag 优化后最好情况 O(n)；内层边界 `n - 1 - i` 别写错
- 二分查找三件套：`left + ((right - left) >> 1)`、闭区间 `left <= right`、`right = mid - 1`，口径全篇一致
- 快排最坏 O(n²) 来自分区失衡；随机基准/三数取中规避；快排不稳定、堆排 O(1) 空间
- 前 K 大用小顶堆（门槛思想）；自底向上建堆 O(n)，单次操作 O(log n)
- 三序递归只有 push 位置不同；中序遍历 BST 得有序序列；深层树用显式栈防爆栈
- LCA 递归出口：root 为空或命中 p/q 即返回；左右都非空则当前节点是 LCA
- LRU = 哈希表定位 + 双向链表维护新旧；Map 插入序 + delete/set 可等价简化
- TimSort 稳定且最坏 O(n log n)，局部有序数据趋近 O(n)；JS 数字排序必须传比较器
- 前端性能问题先抽象：定位找二分、复用找哈希、调度找堆、去环找 WeakMap
