/**
 * 对应题号：ALGO-I2｜堆排序与 TopK：为什么「前 K 大」用小顶堆
 * 运行命令：npx tsx 07-algorithms/i2-heap-topk.ts
 *
 * 堆的数组表示：节点 i 的左孩子 2i+1、右孩子 2i+2、父节点 (i-1) >> 1
 * 自底向上建堆 O(n)；堆排序整体 O(n log n)、原地 O(1) 空间。
 *
 * 「前 K 大」用小顶堆的直觉（门槛思想）：
 *   小顶堆堆顶是堆内 K 个元素里最小的，即当前 TopK 的「准入门槛」；
 *   新元素只有比门槛大才替换它。若用大顶堆，堆顶是全局最大，无法判断谁该被淘汰。
 *   每个元素至多一次 push/pop（各 O(log K)），总计 O(n log K)、空间 O(K)，
 *   且不需要保留全部历史数据，天然适配数据流（实时销量 Top 10）场景。
 */

import assert from 'node:assert';

/** 大顶堆下沉：在 [0, size) 内让下标 i 的元素落到正确位置 */
function siftDown(arr: number[], i: number, size: number): void {
    while (true) {
        const left = 2 * i + 1;
        if (left >= size) break;
        let larger = left;
        const right = left + 1;
        if (right < size && arr[right] > arr[left]) larger = right;
        if (arr[i] >= arr[larger]) break;
        [arr[i], arr[larger]] = [arr[larger], arr[i]];
        i = larger;
    }
}

/** 堆排序（原地，升序） */
export function heapSort(arr: number[]): number[] {
    const n = arr.length;
    // 自底向上建大顶堆：从最后一个非叶子节点开始下沉
    for (let i = (n >> 1) - 1; i >= 0; i--) {
        siftDown(arr, i, n);
    }
    // 堆顶（当前最大值）依次换到末尾，再对剩余前缀下沉
    for (let end = n - 1; end > 0; end--) {
        [arr[0], arr[end]] = [arr[end], arr[0]];
        siftDown(arr, 0, end);
    }
    return arr;
}

// ---------- 小顶堆（供 TopK 使用） ----------
function minHeapPush(heap: number[], val: number): void {
    heap.push(val);
    let i = heap.length - 1;
    while (i > 0) {
        const parent = (i - 1) >> 1; // 上浮
        if (heap[i] >= heap[parent]) break;
        [heap[i], heap[parent]] = [heap[parent], heap[i]];
        i = parent;
    }
}

function minHeapPop(heap: number[]): number {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
        heap[0] = last; // 尾元素补堆顶后下沉
        let i = 0;
        while (true) {
            const left = 2 * i + 1;
            if (left >= heap.length) break;
            let smaller = left;
            const right = left + 1;
            if (right < heap.length && heap[right] < heap[left]) smaller = right;
            if (heap[i] <= heap[smaller]) break;
            [heap[i], heap[smaller]] = [heap[smaller], heap[i]];
            i = smaller;
        }
    }
    return top;
}

/** 求前 K 大元素：维护大小为 K 的小顶堆，返回堆内容（顺序不代表排名） */
export function topK(nums: number[], k: number): number[] {
    if (k <= 0) return [];
    const heap: number[] = [];
    for (const num of nums) {
        if (heap.length < k) {
            minHeapPush(heap, num);
        } else if (num > heap[0]) {
            // 严格大于：比准入门槛高才挤掉堆顶，相等不重复替换
            minHeapPop(heap);
            minHeapPush(heap, num);
        }
    }
    return heap;
}

/** 模拟数据流：逐元素到达时增量维护 TopK（无需保留全量数据） */
class StreamingTopK {
    private heap: number[] = [];
    constructor(private readonly k: number) {}
    add(num: number): void {
        if (this.heap.length < this.k) {
            minHeapPush(this.heap, num);
        } else if (num > this.heap[0]) {
            minHeapPop(this.heap);
            minHeapPush(this.heap, num);
        }
    }
    result(): number[] {
        return [...this.heap].sort((a, b) => b - a);
    }
}

export function run(): void {
    console.log('ALGO-I2 堆排序 + 小顶堆 TopK');

    // ---------- 堆排序用例 ----------
    const sortCases = [[5, 1, 4, 2, 8, 3], [3, 3, 1, 2, 3], [], [42], [9, 8, 7, 6, 5, 4, 3, 2, 1]];
    for (const c of sortCases) {
        const result = heapSort([...c]);
        assert.deepStrictEqual(
            result,
            [...c].sort((a, b) => a - b),
        );
        console.log(`堆排序 [${c.join(', ')}] → [${result.join(', ')}]`);
    }

    // ---------- TopK 用例 ----------
    const nums = [12, 5, 78, 3, 99, 14, 45, 1, 66, 30];
    const k3 = topK(nums, 3);
    assert.deepStrictEqual(
        [...k3].sort((a, b) => a - b),
        [66, 78, 99],
        '前 3 大应为 99/78/66',
    );
    console.log(`数组 [${nums.join(', ')}] 的前 3 大（堆内容，顺序不代表排名）：[${k3.join(', ')}]`);

    assert.deepStrictEqual(topK(nums, 0), [], 'k=0 返回空堆');
    assert.deepStrictEqual(
        topK(nums, 100).sort((a, b) => a - b),
        [...nums].sort((a, b) => a - b),
        'k >= n 时堆内即全部元素',
    );
    assert.deepStrictEqual(
        topK([5, 5, 5, 5], 2).sort((a, b) => a - b),
        [5, 5],
        '相等元素不影响正确性',
    );
    console.log('k=0、k>=n、全等元素边界用例通过');

    // ---------- 与全量排序对照：10 万随机数据 ----------
    const big = Array.from({ length: 100_000 }, () => Math.floor(Math.random() * 1_000_000));
    const k = 10;
    const got = topK(big, k).sort((a, b) => b - a);
    const expected = [...big].sort((a, b) => b - a).slice(0, k);
    assert.deepStrictEqual(got, expected, 'Top10 必须与全量排序取前 10 一致');
    console.log(`10 万数据 Top10：[${got.join(', ')}]（与全量排序结果一致，复杂度 O(n log K)、空间 O(K)）`);

    // ---------- 数据流增量维护 ----------
    const stream = new StreamingTopK(3);
    [3, 19, 2, 100, 50, 8].forEach((v) => stream.add(v));
    assert.deepStrictEqual(stream.result(), [100, 50, 19]);
    console.log('数据流 3→19→2→100→50→8 实时 Top3：[100, 50, 19]');

    console.log('i2 断言全部通过。');
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
