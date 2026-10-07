/**
 * 07-algorithms 一键自测入口
 * 运行命令：npx tsx 07-algorithms/run-all.ts
 *
 * 依次调用各算法文件导出的 run()（断言都在 run 内执行），
 * 任一文件断言失败会立即抛出并以非零码退出。
 */

import { run as runB1 } from './b1-complexity';
import { run as runB2 } from './b2-bubble-sort';
import { run as runB3 } from './b3-binary-search';
import { run as runB4 } from './b4-tree-traversal';
import { run as runI1 } from './i1-quick-sort';
import { run as runI2 } from './i2-heap-topk';
import { run as runI3 } from './i3-tree-ops';
import { run as runA1 } from './a1-min-heap';
import { run as runA2 } from './a2-lru-cache';
import { run as runA3 } from './a3-frontend-algo';

const suites: Array<{ id: string; title: string; run: () => void }> = [
    { id: 'ALGO-B1', title: '时间复杂度实测对比', run: runB1 },
    { id: 'ALGO-B2', title: '冒泡排序（提前退出）', run: runB2 },
    { id: 'ALGO-B3', title: '二分查找（闭区间）', run: runB3 },
    { id: 'ALGO-B4', title: '二叉树前中后序遍历', run: runB4 },
    { id: 'ALGO-I1', title: '快速排序（随机基准）', run: runI1 },
    { id: 'ALGO-I2', title: '堆排序与小顶堆 TopK', run: runI2 },
    { id: 'ALGO-I3', title: '翻转/深度/LCA', run: runI3 },
    { id: 'ALGO-A1', title: '手写最小堆与优先队列', run: runA1 },
    { id: 'ALGO-A2', title: 'LRU 缓存', run: runA2 },
    { id: 'ALGO-A3', title: '前端算法落地（虚拟滚动/LIS/深拷贝）', run: runA3 },
];

const passed: string[] = [];
for (const suite of suites) {
    console.log(`\n================ ${suite.id}｜${suite.title} ================`);
    suite.run();
    passed.push(suite.id);
}

console.log('\n========================================================');
console.log(`全部用例通过：${passed.length}/${suites.length} 个模块（${passed.join(', ')}）`);
