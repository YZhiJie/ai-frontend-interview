# 一、JavaScript 底层原理

> 本领域聚焦语言引擎层面的核心机制：执行上下文、作用域与闭包、事件循环与异步调度、AST 与编译流程，是区分「会用 JS」与「懂原理」的分水岭。在 AI 时代，LLM 流式输出、SSE 长连接、前端 Agent 编排等场景大量依赖异步与主线程调度能力，对 JS 异步功底的要求显著高于传统表单型应用；同时，审查与调优 AI 生成的代码，也必须建立在对这些底层机制的准确理解之上。

**题量分布**：Basic 5 题 · Intermediate 4 题 · Advanced 3 题（共 12 题）

**🎬 配套漫画**：[EP.01 JS 事件循环](../comics/ep01-js-event-loop.svg)

---

## 🟢 Basic（基础）

### JS-B1｜执行上下文的类型与生命周期

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请说明 JavaScript 执行上下文有哪几种类型？并完整描述一个函数执行上下文从创建到销毁的生命周期：创建阶段做了哪些事（this 绑定、变量环境、词法环境），执行阶段又做什么？
- **考察要点**：
  - 三种类型：全局、函数、eval 执行上下文，以及调用栈入栈/出栈模型
  - 创建阶段与执行阶段的职责划分（提升与逐行执行）
  - 变量环境（var/函数声明）与词法环境（let/const 与 TDZ）的分工
- **参考答案要点**：
  - 类型有三种：全局执行上下文（唯一，程序启动时创建）、函数执行上下文（每次调用创建一个）、eval 执行上下文（不推荐使用）。
  - 生命周期分两阶段：创建阶段确定 this 绑定、建立词法环境与变量环境、构建作用域链；执行阶段逐行执行代码并完成变量赋值。
  - 创建阶段：函数声明整体提升，var 声明被提升并初始化为 undefined；this 也在该阶段确定。
  - ES6+ 拆分为「变量环境」（存放 var 与函数声明）与「词法环境」（存放 let/const），后者在声明执行前处于暂时性死区（TDZ），访问会抛 ReferenceError。
  - 函数执行完毕后上下文出栈，若其变量环境没有被闭包引用则被垃圾回收。

### JS-B2｜词法作用域与作用域链

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  什么是词法作用域？它与动态作用域的本质区别是什么？为什么说「作用域链在函数定义时就已确定」？请举例说明：即使改变函数的调用位置，也无法改变内层函数的变量查找路径。
- **考察要点**：
  - 词法作用域（静态作用域）由函数定义位置决定，而非调用位置
  - 作用域链通过函数定义时保存的外部环境引用（[[OuterEnv]]/[[Scope]]）固化
  - 动态作用域按调用栈查找，this 的行为更接近动态作用域
- **参考答案要点**：
  - 词法作用域指变量的查找范围由函数「定义时」所处的词法环境决定，与「在哪里被调用」无关，故又称静态作用域。
  - 每个函数在定义时会保存对外部词法环境的引用，调用时沿该引用逐层向外查找变量，这条查找路径就是作用域链。
  - 动态作用域（如 bash）按调用栈向上查找，调用位置不同结果就不同；JS 中只有 this 的绑定行为近似动态作用域。
  - 典型例子：外层函数返回一个内部函数，内部函数在全局被调用时，读到的仍是定义处作用域的变量，而不是全局同名变量。

### JS-B3｜闭包的定义、形成原理与经典应用

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请给出闭包的准确定义；解释闭包为什么会让外部函数的变量对象（AO）不被垃圾回收；并举至少 2 个工程中的经典应用（如私有变量、防抖），说明各自利用了闭包的什么特性。
- **考察要点**：
  - 闭包 = 函数 + 其定义时词法环境的引用（可跨作用域访问自由变量）
  - 内存机制：内部函数引用外部 AO，因「可达」而不可回收
  - 应用背后的共性：在多次调用之间持久化状态
- **参考答案要点**：
  - 闭包是函数与其词法环境的组合：内部函数在定义作用域之外被调用时，仍能访问定义时的自由变量。
  - 形成原理：内部函数持有对外部函数 AO/变量环境的引用，垃圾回收器因该环境「可达」而无法回收，变量生命周期被延长。
  - 应用一（私有变量）：IIFE/模块模式用闭包隐藏内部状态，仅通过暴露的方法读写，实现封装。
  - 应用二（防抖 debounce）：定时器 id、this 与参数保存在外层作用域中，多次触发之间通过闭包共享同一份状态。
  - 注意代价：闭包延长变量生命周期，若意外持有大对象或 DOM 引用会导致内存泄漏。

### JS-B4｜Promise 基础执行顺序（微任务 vs 宏任务）

- **题型**：代码分析题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  写出以下代码的完整输出顺序，并解释每一步分别发生在同步执行、微任务队列还是宏任务队列：

```js
console.log('start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('then'));
console.log('end');
```

- **考察要点**：
  - 同步代码执行完毕后，才会清空微任务队列
  - then 回调进入微任务队列，setTimeout 回调进入宏任务队列
  - 事件循环「执行一个宏任务 → 清空微任务」的基本节奏
- **参考答案要点**：
  - 输出结果：`start` → `end` → `then` → `timeout`。
  - 推演：同步阶段依次打印 `start`、`end`，期间 setTimeout 回调被注册到宏任务队列，then 回调被注册到微任务队列。
  - 同步执行完毕后事件循环先清空微任务队列：打印 `then`。
  - 微任务清空后才取出宏任务：打印 `timeout`；即使 delay 为 0 也要等下一轮循环，无法抢占微任务。

### JS-B5｜var 与 let 在循环 + setTimeout 中的输出差异

- **题型**：代码分析题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  以下两个循环的输出分别是什么？为什么行为不同？

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var:', i), 0);
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log('let:', j), 0);
}
```

- **考察要点**：
  - var 的函数/全局作用域特性导致整个循环共享同一个变量绑定
  - let 每轮迭代创建新的块级词法环境（规范的 per-iteration binding 机制）
  - 回调执行时机晚于循环结束，读取的是被捕获的变量绑定
- **参考答案要点**：
  - 输出结果：先连续输出 3 行 `var: 3`，再输出 `let: 0`、`let: 1`、`let: 2`。
  - var 版本：i 是全局唯一绑定，同步循环结束时 i 已等于 3；三个回调共享同一个 i，故全部打印 3。
  - let 版本：规范规定每轮迭代都会基于上一轮的值创建一个新的块级词法环境，回调各自捕获当轮的 j。
  - 两个循环的 setTimeout 都是宏任务，都在同步代码结束后才执行，所以 var 版本读到的是循环结束后的最终值。
  - var 的经典修复手段是 IIFE 包裹或缓存形参；let 是语言层面的官方解法。

## 🟡 Intermediate（进阶）

### JS-I1｜宏任务与微任务混合调度

- **题型**：代码分析题
- **难度**：Intermediate ★★★★☆
- **问题描述**：
  写出以下代码的完整输出顺序（共 8 行输出），并说明每一轮「宏任务 + 清空微任务」的过程：

```js
console.log('1');
setTimeout(() => {
  console.log('2');
  queueMicrotask(() => console.log('3'));
}, 0);
Promise.resolve().then(() => console.log('4')).then(() => {
  console.log('5');
  setTimeout(() => console.log('6'), 0);
});
queueMicrotask(() => console.log('7'));
console.log('8');
```

- **考察要点**：
  - 微任务队列必须完全清空后，才会进入下一个宏任务
  - then 链的注册时机：前一个回调执行完才注册下一个
  - 宏任务执行期间新产生的微任务，会在该宏任务结束后立即被清空
- **参考答案要点**：
  - 输出结果：`1` `8` `4` `7` `5` `2` `3` `6`。
  - 同步阶段：打印 `1`、`8`；此时微任务队列 = [打印4, 打印7]。
  - 清空微任务：打印 `4`（同时注册第二个 then 回调）、打印 `7`、打印 `5`（并注册宏任务「打印6」）。
  - 第一个宏任务（setTimeout）：打印 `2`，queueMicrotask 注册「打印3」；该宏任务结束后立即清空微任务，打印 `3`。
  - 第二个宏任务：打印 `6`。
  - 关键机制：微任务在「当前宏任务结束」时清空，而不是等所有宏任务执行完。

### JS-I2｜async/await 与 Promise.then 混合执行顺序

- **题型**：代码分析题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  写出以下代码的完整输出顺序，并解释为什么「await 之后的代码相当于注册了一个 then 微任务」：

```js
console.log('script start');

setTimeout(() => console.log('setTimeout'), 0);

async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => console.log('promise2'));

console.log('script end');
```

- **考察要点**：
  - async 函数体在 await 之前的部分是同步执行的
  - await 暂停函数，把后续代码作为微任务续体调度（等价于 .then 的回调）
  - Promise 构造函数的 executor 是同步执行的
- **参考答案要点**：
  - 输出结果：`script start` → `async1 start` → `async2` → `promise1` → `script end` → `async1 end` → `promise2` → `setTimeout`。
  - 推演：async1 被调用后同步执行到 `await async2()`；async2 同步打印 `async2`；随后 async1 暂停，`async1 end` 作为续体进入微任务队列，等价于 `async2().then(() => console.log('async1 end'))`。
  - new Promise 的 executor 同步执行，打印 `promise1`；其 then 注册的微任务排在 await 续体之后。
  - 打印 `script end` 后同步代码结束，按注册顺序清空微任务：`async1 end`、`promise2`；最后执行宏任务打印 `setTimeout`。
  - 说明：以上是现代引擎（Node 12+ / Chrome 80+，符合规范实现）的行为；早期 V8 对 await 的实现会多一次微任务轮转，顺序可能不同。

### JS-I3｜单线程模型对前端性能的影响与优化策略

- **题型**：实际场景应用题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  场景约束：某后台管理系统切换到大报表页后，输入框卡顿明显、按钮点击无响应，Performance 面板出现多个 800ms+ 的长任务（Long Task）。请结合 JS 单线程模型解释卡顿根因，并给出至少 3 种可落地的优化策略（如长任务分片、Web Worker、时间切片、防抖节流等），说明各自的适用条件与代价。
- **考察要点**：
  - 单线程下 JS 执行、样式布局、绘制、事件处理竞争同一主线程
  - 长任务超过 50ms 会阻塞交互响应（INP 指标恶化）
  - 各优化策略的适用边界与引入的代价
- **参考答案要点**：
  - 根因：主线程同一时刻只能做一件事，超长同步计算（渲染大表格、同步排序聚合）霸占主线程，事件回调只能排队等待，造成卡顿。
  - 策略一（长任务分片）：把大计算切成 <50ms 的小块，用 setTimeout / MessageChannel / scheduler.postTask 让出主线程，让高优先级事件能插队。
  - 策略二（Web Worker）：把纯计算（CSV 解析、数据聚合、加解密）移到 worker 线程，用 postMessage + Transferable 传输数据，不阻塞 UI；限制是无法直接操作 DOM、有通信开销。
  - 策略三（时间切片）：借鉴 React Fiber 思路按优先级分帧执行，低优先级任务用 requestIdleCallback 在空闲期处理。
  - 策略四（防抖节流）：对 resize/scroll/input 等高频事件限频，避免重复触发重计算与重排。
  - 取舍：分片用总耗时换响应性；Worker 适合无 DOM 依赖的纯计算；防抖节流只缓解频率、不缩短单次耗时，需按场景组合使用。

### JS-I4｜AST 结构识别

- **题型**：理论概念题 + 代码分析题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  以下是对 `const x = 1 + 2;` 解析后得到的精简 AST（JSON 形式）。请识别各节点类型的含义、说明整棵树的层级关系，并回答：若要把 `1 + 2` 折叠为 `3`（常量折叠），应操作哪个节点？

```js
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "kind": "const",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": { "type": "Identifier", "name": "x" },
          "init": {
            "type": "BinaryExpression",
            "operator": "+",
            "left": { "type": "Literal", "value": 1, "raw": "1" },
            "right": { "type": "Literal", "value": 2, "raw": "2" }
          }
        }
      ]
    }
  ]
}
```

- **考察要点**：
  - AST 是源码的树状结构化表示，是编译器/转译器的中间产物
  - 节点类型语义：声明语句、声明符、标识符、二元表达式、字面量
  - 父子层级关系与节点替换的入口位置
- **参考答案要点**：
  - Program 是根节点，body 数组存放顶层语句，这里只有一条变量声明语句。
  - VariableDeclaration（kind: "const"）表示声明语句；其 declarations 数组中的 VariableDeclarator 表示一对「声明符 = 初始化值」。
  - id 是 Identifier 节点，即变量名 x；init 是初始化表达式。
  - init 是 BinaryExpression：由 operator "+" 与左右两个操作数组成，left/right 均为 Literal 字面量节点（value 是实际值，raw 是源码文本）。
  - 层级链：Program → VariableDeclaration → VariableDeclarator → ( Identifier, BinaryExpression → Literal × 2 )。
  - 常量折叠应整体替换 init 节点：把 BinaryExpression 换成 `{"type": "Literal", "value": 3, "raw": "3"}`，这正是 Babel 插件在遍历中 replaceWith 节点的典型场景。

## 🔴 Advanced（高级）

### JS-A1｜浏览器与 Node 事件循环差异综合分析

- **题型**：架构设计题 + 理论概念题
- **难度**：Advanced ★★★★★
- **问题描述**：
  请从架构层面对比浏览器与 Node.js 的事件循环模型：①宏任务与微任务的执行时机差异（含新旧版本 Node 的行为变化）；②process.nextTick 与 Promise 微任务的优先级关系；③Node 的 timers/poll/check 阶段划分；④setImmediate 与 setTimeout(0) 的执行顺序；⑤浏览器每轮循环后的渲染时机。并说明为什么跨端代码（如 SSR、CLI 工具）不能假设两端的调度顺序一致。
- **考察要点**：
  - 浏览器模型：一个宏任务 → 清空全部微任务 → 判断渲染（rAF 时机）
  - Node 模型：分阶段循环（timers/pending/poll/check/close）与版本差异
  - nextTick 队列与微任务队列的优先级关系
- **参考答案要点**：
  - 浏览器：每轮取一个宏任务执行，随后清空全部微任务，再进入渲染判断；rAF 回调在样式/布局计算之前、绘制之前执行，宏任务间隙是渲染的机会。
  - Node：事件循环按阶段轮转——timers（到期的 setTimeout/setInterval）→ pending callbacks → poll（I/O 回调，可能阻塞等待新事件）→ check（setImmediate）→ close callbacks；Node ≥11 改为「每个宏任务执行后立即清空微任务」与浏览器趋同，旧版本（≤10）是「整个阶段结束后」才清空。
  - process.nextTick 拥有独立队列，优先级高于 Promise 微任务：每次清空时先执行完 nextTick 队列再执行微任务队列；递归滥用 nextTick 会让 I/O 回调饿死。
  - setImmediate vs setTimeout(0)：在主模块中两者顺序不确定（受 1ms 下限与机器性能影响，通常 setTimeout 先执行）；在 I/O 回调内部 setImmediate 恒定先执行（poll 阶段之后紧接 check 阶段）。
  - 架构结论：跨端代码不能依赖「微任务与宏任务的精确穿插顺序」，应用 await / 队列原语显式表达时序依赖，避免用 setTimeout(0) 做时序兜底。

### JS-A2｜Babel 编译流程中 AST 的深度应用

- **题型**：实际场景应用题
- **难度**：Advanced ★★★★★
- **问题描述**：
  场景约束：团队需要在生产构建时自动移除所有 `console.*` 调用，并为老浏览器提供 API 降级能力（如把 `arr.flat()` 降级为 polyfill 引入或手写实现）。请描述 Babel 的编译流程（parse → transform → generate）、visitor 模式的工作机制，给出移除 console 插件的关键代码，并说明 API 降级插件的实现思路。
- **考察要点**：
  - Babel 三段式流水线与各阶段职责
  - visitor 模式：按节点类型命中访问器，path 提供父子关系与操作方法
  - 插件只能看到语法信息（AST），拿不到运行时类型
- **参考答案要点**：
  - 流程：parse（@babel/parser 把源码解析为 AST）→ transform（@babel/traverse 按 visitor 深度优先遍历，插件在此增删改节点）→ generate（@babel/generator 把 AST 还原为代码并生成 sourcemap）。
  - visitor 模式：遍历到某个 type 的节点就调用同名访问器函数；path 对象封装节点引用、父子关系与操作方法（remove / replaceWith / insertBefore / skip）。
  - 移除 console 插件关键代码：

```js
// babel-plugin-remove-console.js
module.exports = function ({ types: t }) {
  return {
    name: 'remove-console',
    visitor: {
      CallExpression(path) {
        const callee = path.get('callee');
        const isConsole = callee.isMemberExpression()
          && callee.get('object').isIdentifier({ name: 'console' });
        if (!isConsole) return;
        // 语句位置的调用直接删除；作为表达式使用时替换为 void 0，保持语法合法
        if (path.parentPath.isExpressionStatement()) {
          path.remove();
        } else {
          path.replaceWith(t.unaryExpression('void', t.numericLiteral(0)));
        }
      },
    },
  };
};
```

  - API 降级插件思路：在 MemberExpression / CallExpression 访问器中匹配目标 API（如 object 为 Array、property 为 flat），结合 @babel/preset-env 的 useBuiltIns 与 Browserslist targets，仅在目标浏览器缺失该 API 时注入 core-js 的 import 或替换为 polyfill 引用。
  - 工程要点：插件执行顺序影响结果；AST 只有静态语法信息，与运行时值/类型相关的降级还需运行时探测兜底。

### JS-A3｜真实项目 JS 性能优化案例

- **题型**：实际场景应用题
- **难度**：Advanced ★★★★☆
- **问题描述**：
  场景约束：某电商中后台的「五万行 SKU 列表」页在滚动与筛选时严重卡顿：Performance 面板掉帧至 15 FPS，Memory 堆快照随操作次数持续增长且出现大量 detached DOM，滚动回调中存在明显的强制同步布局（Layout Shift 锯齿）。请给出问题定位思路（内存泄漏、强制同步布局、频繁事件处理三个方向）与对应的优化方案（虚拟列表、节流、requestAnimationFrame、WeakMap 等），并给出优化前后的量化对比。
- **考察要点**：
  - 用 DevTools 定位：Performance 长任务、Memory 堆快照对比、Performance Monitor
  - 三类典型病灶：泄漏（闭包/全局缓存/DOM 引用）、强制同步布局、高频事件
  - 方案与病灶一一对应，且能用指标量化验证
- **参考答案要点**：
  - 定位一（内存泄漏）：多次堆快照对比发现 detached DOM 与闭包 retained size 持续增长——根因是全局数组缓存选中行时保留了对 DOM 节点的引用。
  - 定位二（强制同步布局）：滚动回调里先读 offsetHeight 再写样式，读写交替导致浏览器反复 layout。
  - 定位三（高频事件）：scroll/input 未节流，每像素滚动都触发一次全量筛选计算，产生 800ms 长任务。
  - 优化一：改虚拟列表，只渲染可视区 ±buffer 的行，DOM 节点从 5 万降到约 30 个；行状态改用 WeakMap 存储，不再挂在 DOM 上，避免泄漏路径。
  - 优化二：读写分离 + requestAnimationFrame 批量更新样式；位移类更新统一用 transform，避免重排。
  - 优化三：scroll 监听加 rAF 节流与 passive: true；筛选计算移入 Web Worker 并分片回填。
  - 量化对比：滚动 FPS 15 → 稳定 60；页面内存峰值 1.2GB → 180MB；detached DOM 不再增长；筛选响应 800ms → 90ms（分片后首帧 <50ms）。

---

## 📌 本领域高频考点速记

- 执行上下文创建阶段确定 this、作用域链与变量提升，执行阶段才逐行赋值。
- 词法作用域在函数定义时固化；this 才是运行时（由调用方式）决定的。
- 闭包 = 函数 + 定义时词法环境的引用；代价是 AO 生命周期延长，警惕内存泄漏。
- 同步代码执行完 → 清空全部微任务 → 取一个宏任务；then / queueMicrotask / await 续体都是微任务。
- var 循环共享一个绑定输出 3,3,3；let 每轮新建词法环境输出 0,1,2。
- process.nextTick 队列优先于 Promise 微任务；Node ≥11 每个宏任务后清空微任务，与浏览器趋同。
- I/O 回调中 setImmediate 恒先于 setTimeout(0)；主模块中两者顺序不确定。
- Babel = parse（AST）→ transform（traverse + visitor）→ generate；插件只操作 AST 节点。
- 长任务 >50ms 阻塞交互：分片、Web Worker、时间切片、防抖节流按场景组合使用。
- AST 是编译原理的核心抽象：读懂节点类型与父子层级，就能读懂一切转译工具。
