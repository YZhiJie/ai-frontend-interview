/**
 * 对应题号：ALGO-B3｜手写二分查找：循环不变量与边界陷阱
 * 运行命令：npx tsx 07-algorithms/b3-binary-search.ts
 *
 * 闭区间口径：搜索区间恒为 [left, right]
 * - 循环条件 left <= right（区间非空）
 * - 排除右半区：left = mid + 1；排除左半区：right = mid - 1
 * - mid = left + ((right - left) >> 1)：等价 floor((left+right)/2)，且不受超大值相加影响
 * 循环不变量：若 target 存在，则必在 [left, right] 内；终止时区间为空即不存在，返回 -1
 */

import assert from 'node:assert';

export function binarySearch(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length - 1; // 闭区间 [left, right]
    while (left <= right) {
        const mid = left + ((right - left) >> 1); // 偏移 + 右移取整，防止 (left+right) 溢出/得到小数
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1; // 目标只可能在右半区间 [mid+1, right]
        } else {
            right = mid - 1; // 目标只可能在左半区间 [left, mid-1]
        }
    }
    return -1; // 区间为空，目标不存在
}

export function run(): void {
    console.log('ALGO-B3 二分查找（闭区间口径）');
    const nums = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

    // ---------- 命中用例 ----------
    const hitCases: Array<[number, number]> = [
        [1, 0], // 首元素
        [19, 9], // 尾元素
        [7, 3], // 中间元素
        [11, 5],
        [3, 1],
    ];
    for (const [target, expected] of hitCases) {
        const idx = binarySearch(nums, target);
        assert.strictEqual(idx, expected, `查找 ${target} 应在下标 ${expected}`);
        console.log(`查找 ${target} → 下标 ${idx}`);
    }

    // ---------- 未命中用例 ----------
    const missCases = [0, 2, 8, 20, 100];
    for (const target of missCases) {
        const idx = binarySearch(nums, target);
        assert.strictEqual(idx, -1, `${target} 不存在应返回 -1`);
        console.log(`查找 ${target} → ${idx}（不存在）`);
    }

    // ---------- 边界：空数组 / 单元素 ----------
    assert.strictEqual(binarySearch([], 1), -1, '空数组直接返回 -1');
    assert.strictEqual(binarySearch([42], 42), 0, '单元素命中');
    assert.strictEqual(binarySearch([42], 7), -1, '单元素未命中');
    console.log('空数组与单元素边界用例通过');

    // ---------- 大数据正确性对照：与 indexOf 结果一致 ----------
    const big = Array.from({ length: 100000 }, (_, i) => i * 2);
    for (const target of [0, 99998, 123456, 77777]) {
        const expected = big.indexOf(target);
        assert.strictEqual(binarySearch(big, target), expected);
    }
    console.log('10 万规模随机目标与 indexOf 对照全部一致，时间复杂度 O(log n)');
    console.log('b3 断言全部通过。');
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
