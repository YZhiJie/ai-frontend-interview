/**
 * 对应题号：ALGO-A3｜算法在前端工程中的真实落地：从虚拟滚动到树 diff
 * 运行命令：npx tsx 07-algorithms/a3-frontend-algo.ts
 *
 * 三个真实前端场景的算法演示：
 * 1. 虚拟滚动：动态行高下维护「每行顶部偏移」前缀和（单调递增），用二分定位起始渲染索引 O(log n)
 * 2. keyed diff（Vue 3 思路）：求新列表可复用节点索引序列的最长递增子序列（LIS），
 *    LIS 命中的节点保持不动，只移动其余节点，DOM 操作最少（O(n log n) 返回下标链）
 * 3. 深拷贝循环引用：WeakMap 记录「原对象 → 拷贝对象」，再次遇到直接复用，既防爆栈又保持引用一致；
 *    键为弱引用，不阻止原对象被 GC
 */

import assert from 'node:assert';

// ============ ① 虚拟滚动起始索引二分定位 ============
/**
 * 已知每行高度，构建行顶偏移前缀和：offsets[i] = 第 i 行顶部距容器顶部的距离（严格递增）。
 * 给定 scrollTop，求第一个「底部还在视口内」的行之前……这里返回 scrollTop 所在行（起始渲染索引）：
 * 即 offsets 中最后一个 <= scrollTop 的下标；scrollTop 落在第一行之前时返回 0。
 */
export function buildOffsets(heights: number[]): number[] {
    const offsets = [0];
    for (let i = 0; i < heights.length; i++) offsets.push(offsets[i] + heights[i]);
    return offsets; // offsets[i] = 第 i 行顶部偏移；offsets[n] = 总高度
}

export function findStartIndex(offsets: number[], scrollTop: number): number {
    // 在 offsets[0..n-1] 中二分最后一个 <= scrollTop 的偏移
    let left = 0;
    let right = offsets.length - 2; // 最后一个行顶偏移（offsets[n] 是总高度，不是某行顶部）
    let result = 0;
    while (left <= right) {
        const mid = left + ((right - left) >> 1);
        if (offsets[mid] <= scrollTop) {
            result = mid;
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return result;
}

// ============ ② 最长递增子序列（返回下标链，Vue 3 keyed diff 同款） ============
/**
 * 输入新列表中「可复用旧节点」的旧索引序列（不可复用位置用 -1 占位），
 * 返回 LIS 在序列中的下标数组（严格递增；同分时取靠后者，配合前驱链回溯，得到正确链）。
 * 时间 O(n log n)。命中该链的节点无需移动。
 */
export function lisIndices(seq: number[]): number[] {
    const valid: Array<{ value: number; index: number }> = [];
    seq.forEach((value, index) => {
        if (value !== -1) valid.push({ value, index });
    });

    // tails[k] = 长度为 k+1 的递增子序列的最小尾值元素；prev 记录前驱用于还原真实链
    const tails: Array<{ value: number; index: number }> = [];
    const prev = new Map<number, number>();

    for (const item of valid) {
        let lo = 0;
        let hi = tails.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (tails[mid].value < item.value) lo = mid + 1;
            else hi = mid;
        }
        if (lo > 0) prev.set(item.index, tails[lo - 1].index);
        tails[lo] = item;
    }

    // 从最长链的末尾沿前驱回溯
    const result: number[] = [];
    let cur: number | undefined = tails.length ? tails[tails.length - 1].index : undefined;
    while (cur !== undefined) {
        result.push(cur);
        cur = prev.get(cur);
    }
    return result.reverse();
}

// ============ ③ 深拷贝 + WeakMap 循环引用处理 ============
export function deepClone<T>(value: T, cache = new WeakMap<object, unknown>()): T {
    // 原始值 / function 直接返回（函数通常共享引用）
    if (value === null || typeof value !== 'object') return value;

    const cached = cache.get(value as unknown as object);
    if (cached !== undefined) return cached as T; // 已拷贝过：复用，斩断循环引用

    if (Array.isArray(value)) {
        const copy: unknown[] = [];
        cache.set(value as unknown as object, copy); // 先入缓存再递归
        value.forEach((v, i) => {
            copy[i] = deepClone(v, cache);
        });
        return copy as unknown as T;
    }

    if (value instanceof Date) return new Date(value.getTime()) as unknown as T;
    if (value instanceof RegExp) return new RegExp(value.source, value.flags) as unknown as T;

    const copy: Record<string, unknown> = {};
    cache.set(value as unknown as object, copy);
    Reflect.ownKeys(value as object).forEach((key) => {
        copy[key as string] = deepClone((value as Record<string | symbol, unknown>)[key], cache);
    });
    return copy as T;
}

export function run(): void {
    console.log('ALGO-A3 算法在前端工程中的真实落地');

    // ---------- ① 虚拟滚动 ----------
    const heights = [40, 60, 30, 80, 50, 100, 40, 70]; // 动态行高
    const offsets = buildOffsets(heights);
    assert.deepStrictEqual(offsets, [0, 40, 100, 130, 210, 260, 360, 400, 470]);
    const scrollCases: Array<[number, number]> = [
        [0, 0],
        [39, 0],
        [40, 1], // 正好滚到第 1 行顶部
        [150, 3], // 150 落在第 3 行（第 3 行区间 130~210）
        [209, 3], // 209 仍在第 3 行
        [470, 7], // 滚到底
    ];
    for (const [scrollTop, expected] of scrollCases) {
        assert.strictEqual(findStartIndex(offsets, scrollTop), expected);
    }
    console.log(`行顶偏移表：[${offsets.join(', ')}]`);
    console.log('scrollTop 0/40/150/470 → 起始索引 0/1/3/7，二分定位 O(log n)（对比线性扫描 O(n)）');

    // 10 万行规模：定位仍然是对数级
    const bigHeights = Array.from({ length: 100_000 }, (_, i) => 30 + (i % 7) * 5);
    const bigOffsets = buildOffsets(bigHeights);
    const start = performance.now();
    const idx = findStartIndex(bigOffsets, 1_800_000);
    const costUs = (performance.now() - start) * 1000;
    assert.ok(bigOffsets[idx] <= 1_800_000 && bigOffsets[idx + 1] > 1_800_000);
    console.log(`10 万行中定位 scrollTop=1800000 → 索引 ${idx}，耗时 ${costUs.toFixed(1)} 微秒`);

    // ---------- ② LIS 用于 keyed diff ----------
    // 旧节点序列 a b c d e；新顺序 b e c a d，映射到旧索引 = [1,4,2,0,3]
    const seq = [1, 4, 2, 0, 3];
    const lis = lisIndices(seq);
    // LIS 为 1,2,3（值）对应 seq 下标 0,2,4 → 这些位置的节点保持不动
    assert.deepStrictEqual(lis, [0, 2, 4]);
    assert.deepStrictEqual(
        lis.map((i) => seq[i]),
        [1, 2, 3],
    );
    console.log(
        `新列表旧索引序列 [${seq.join(', ')}] 的 LIS 下标 [${lis.join(', ')}]（节点 b→c→d 原位不动，只移动其余）`,
    );
    assert.deepStrictEqual(lisIndices([-1, 0, -1, 1, 2]), [1, 3, 4], '含 -1 占位时跳过不可复用节点');
    assert.deepStrictEqual(lisIndices([]), []);
    assert.deepStrictEqual(lisIndices([5]), [0]);

    // ---------- ③ 深拷贝循环引用 ----------
    interface NodeObj {
        name: string;
        self?: NodeObj;
        nested?: { fromParent?: NodeObj; arr: Array<number | { x: number }> };
    }
    const obj: NodeObj = { name: 'root' };
    obj.self = obj; // 自引用
    obj.nested = { arr: [1, 2, { x: 3 }] };
    obj.nested.fromParent = obj; // 环

    const cloned = deepClone(obj);
    assert.notStrictEqual(cloned, obj, '顶层是新对象');
    assert.strictEqual(cloned.self, cloned, '自引用指向克隆自身，而非原对象');
    assert.strictEqual(cloned.nested!.fromParent, cloned, '环引用保持一致且不会无限递归');
    assert.notStrictEqual(cloned.nested!.arr, obj.nested!.arr, '数组也是新副本');
    cloned.nested!.arr.push(99);
    assert.strictEqual(obj.nested!.arr.length, 3, '修改克隆不影响原对象');
    console.log('含自引用 + 环引用的对象深拷贝成功：引用一致性保持、互不影响、无爆栈');

    // WeakMap 键为弱引用：原对象可被 GC（此处仅验证键类型与普通 Map 的差异说明）
    const weak = new WeakMap<object, number>();
    weak.set(obj, 1);
    assert.strictEqual(weak.get(obj), 1);
    console.log('使用 WeakMap 而非 Map：拷贝完成后缓存不阻止原对象被垃圾回收');

    console.log('a3 断言全部通过。');
}

import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
