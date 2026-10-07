/**
 * 对应题号：ALGO-I1｜手写快速排序：partition、随机基准与最坏情况分析
 * 运行命令：npx tsx 07-algorithms/i1-quick-sort.ts
 *
 * partition 不变量：基准左侧全部小于它、右侧全部不小于它。
 * 随机基准把「输入分布」与「基准选择」解耦，避免有序数组固定取左端退化为 O(n²)。
 * 平均 O(n log n)，最坏 O(n²)；递归深度期望 O(log n)，不会爆栈。
 */

import assert from 'node:assert';
import { performance } from 'node:perf_hooks';

/** 分区：随机选取基准并归位，返回基准最终下标 */
export function partition(arr: number[], left: number, right: number): number {
    // 随机基准与左端交换，防止有序/近有序输入退化
    const randIdx = left + Math.floor(Math.random() * (right - left + 1));
    [arr[left], arr[randIdx]] = [arr[randIdx], arr[left]];

    const pivot = arr[left];
    let i = left + 1; // [left+1, i) 区间内的元素均小于 pivot
    for (let j = left + 1; j <= right; j++) {
        if (arr[j] < pivot) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            i += 1;
        }
    }
    [arr[left], arr[i - 1]] = [arr[i - 1], arr[left]]; // 基准归位
    return i - 1;
}

/** 原地快速排序；先递归较小一侧，把最坏栈深控制在 O(log n) */
export function quickSort(arr: number[], left = 0, right = arr.length - 1): number[] {
    while (left < right) {
        const p = partition(arr, left, right);
        if (p - left < right - p) {
            quickSort(arr, left, p - 1); // 较小一侧递归
            left = p + 1; // 较大一侧改为循环（尾递归消除）
        } else {
            quickSort(arr, p + 1, right);
            right = p - 1;
        }
    }
    return arr;
}

function randomIntArray(n: number, max = 1_000_000): number[] {
    return Array.from({ length: n }, () => Math.floor(Math.random() * max));
}

export function run(): void {
    console.log('ALGO-I1 快速排序（随机基准 + partition）');

    // ---------- 小数组用例 ----------
    const cases: Array<{ name: string; arr: number[] }> = [
        { name: '普通随机', arr: [5, 1, 4, 2, 8, 3, 7, 6] },
        { name: '已排序', arr: [1, 2, 3, 4, 5, 6, 7, 8] },
        { name: '完全逆序', arr: [8, 7, 6, 5, 4, 3, 2, 1] },
        { name: '大量重复', arr: [2, 2, 2, 1, 1, 3, 3, 2] },
        { name: '空数组', arr: [] },
        { name: '单元素', arr: [42] },
    ];
    for (const c of cases) {
        const result = quickSort([...c.arr]);
        const expected = [...c.arr].sort((a, b) => a - b);
        assert.deepStrictEqual(result, expected, `${c.name} 用例`);
        console.log(`${c.name.padEnd(6)}：[${result.join(', ')}]`);
    }

    // ---------- 10 万随机数组性能用例 ----------
    const n = 100_000;
    const big = randomIntArray(n);
    const start = performance.now();
    quickSort(big);
    const cost = performance.now() - start;
    assert.ok(big.every((v, i) => i === 0 || big[i - 1] <= v), '10 万数组排序后必须升序');
    console.log(`10 万随机数组排序耗时：${cost.toFixed(2)} ms（期望 O(n log n)）`);
    assert.ok(cost < 1000, '随机基准下 10 万数据应在 1 秒内完成');

    // ---------- 10 万「已排序」数组：随机基准下不应退化 ----------
    const sorted = Array.from({ length: n }, (_, i) => i);
    const start2 = performance.now();
    quickSort(sorted);
    const cost2 = performance.now() - start2;
    assert.ok(sorted.every((v, i) => v === i), '有序数组排序结果不变');
    console.log(`10 万已排序数组耗时：${cost2.toFixed(2)} ms（随机基准避免 O(n²) 退化）`);
    assert.ok(cost2 < 1000, '若固定取左端基准，该用例会退化为 O(n²) 甚至爆栈');

    console.log('i1 断言全部通过。');
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
