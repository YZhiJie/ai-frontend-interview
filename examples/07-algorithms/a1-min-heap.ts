/**
 * 对应题号：ALGO-A1｜手写最小堆与优先队列：siftUp / siftDown 完整实现
 * 运行命令：npx tsx 07-algorithms/a1-min-heap.ts
 *
 * 数组表示下标换算：parent=(i-1)>>1，left=2i+1，right=2i+2
 * push：尾插后上浮 siftUp，O(log n)；pop：尾元素补堆顶后下沉 siftDown，O(log n)；peek O(1)
 */

import assert from 'node:assert';

interface HeapItem<T> {
    value: T;
    priority: number;
}

/** 泛型最小堆：可直接存数字，也可存 { value, priority } 形式的优先队列元素 */
export class MinHeap<T> {
    private heap: HeapItem<T>[] = [];

    constructor(
        private readonly toPriority: (item: HeapItem<T>) => number = (item) => item.priority,
    ) {}

    get size(): number {
        return this.heap.length;
    }

    /** 查看堆顶（优先级最小者），空堆返回 null */
    peekValue(): T | null {
        return this.heap.length ? this.heap[0].value : null;
    }

    /** 入队：先尾插再上浮 */
    push(value: T, priority?: number): void {
        const item: HeapItem<T> =
            priority === undefined
                ? ({ value, priority: value as unknown as number } as HeapItem<T>)
                : { value, priority };
        this.heap.push(item);
        this.siftUp(this.heap.length - 1);
    }

    /** 取出优先级最小的元素：尾元素补堆顶再下沉 */
    pop(): T | null {
        if (!this.heap.length) return null;
        const top = this.heap[0];
        const last = this.heap.pop()!;
        if (this.heap.length) {
            this.heap[0] = last;
            this.siftDown(0);
        }
        return top.value;
    }

    /** 上浮：比父节点小才交换 */
    private siftUp(i: number): void {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.toPriority(this.heap[i]) >= this.toPriority(this.heap[parent])) break;
            [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
            i = parent;
        }
    }

    /** 下沉：与两个孩子中优先级更小者比较，比它大才交换 */
    private siftDown(i: number): void {
        const n = this.heap.length;
        while (true) {
            const left = 2 * i + 1;
            if (left >= n) break;
            let smaller = left;
            const right = left + 1;
            if (right < n && this.toPriority(this.heap[right]) < this.toPriority(this.heap[left])) {
                smaller = right;
            }
            if (this.toPriority(this.heap[i]) <= this.toPriority(this.heap[smaller])) break;
            [this.heap[i], this.heap[smaller]] = [this.heap[smaller], this.heap[i]];
            i = smaller;
        }
    }

    /** 校验内部数组满足小顶堆性质（测试辅助方法） */
    isHeapOrdered(): boolean {
        for (let i = 1; i < this.heap.length; i++) {
            const parent = (i - 1) >> 1;
            if (this.toPriority(this.heap[parent]) > this.toPriority(this.heap[i])) return false;
        }
        return true;
    }
}

/** 便捷子类：纯数字最小堆 */
export class NumberMinHeap extends MinHeap<number> {}

export function run(): void {
    console.log('ALGO-A1 手写最小堆 / 优先队列');

    // ---------- 数字堆：push/peek/pop/堆序 ----------
    const heap = new NumberMinHeap();
    assert.strictEqual(heap.pop(), null, '空堆 pop 返回 null');
    assert.strictEqual(heap.peekValue(), null);

    [5, 3, 8, 1, 9, 2, 7].forEach((n) => {
        heap.push(n);
        assert.ok(heap.isHeapOrdered(), '每次 push 上浮后仍满足堆序');
    });
    assert.strictEqual(heap.size, 7);
    assert.strictEqual(heap.peekValue(), 1, '堆顶恒为最小值 1');

    const popped: number[] = [];
    while (heap.size > 0) {
        assert.ok(heap.isHeapOrdered(), '每次 pop 下沉后仍满足堆序');
        popped.push(heap.pop()!);
    }
    assert.deepStrictEqual(popped, [1, 2, 3, 5, 7, 8, 9], '依次 pop 必须得到升序序列（堆排序原理）');
    console.log('数字堆依次 pop：[1, 2, 3, 5, 7, 8, 9]');

    // ---------- 单元素边界 ----------
    heap.push(42);
    assert.strictEqual(heap.pop(), 42);
    assert.strictEqual(heap.size, 0, '仅一个元素时 pop 后堆为空，不再下沉');

    // ---------- 优先队列：按优先级（数值越小越优先）调度任务 ----------
    const pq = new MinHeap<string>();
    pq.push('普通上报', 5);
    pq.push('用户输入回调', 1);
    pq.push('后台预取', 9);
    pq.push('动画帧任务', 2);
    assert.strictEqual(pq.peekValue(), '用户输入回调');
    const schedule: string[] = [];
    while (pq.size > 0) schedule.push(pq.pop()!);
    assert.deepStrictEqual(schedule, ['用户输入回调', '动画帧任务', '普通上报', '后台预取']);
    console.log('优先队列调度顺序：用户输入回调 → 动画帧任务 → 普通上报 → 后台预取');
    console.log('（前端应用：React Scheduler 式按过期时间调度、重试时间排序、限流令牌过期弹出）');

    // ---------- 大批量数据验证：与全量排序对照 ----------
    const big = new NumberMinHeap();
    const data = Array.from({ length: 50_000 }, () => Math.floor(Math.random() * 1_000_000));
    data.forEach((n) => big.push(n));
    const expected = [...data].sort((a, b) => a - b);
    let ok = true;
    for (let i = 0; i < data.length; i++) {
        if (big.pop() !== expected[i]) {
            ok = false;
            break;
        }
    }
    assert.ok(ok, '5 万元素逐个 pop 结果与排序一致');
    console.log('5 万元素 push/pop 结果与全量排序一致，各操作 O(log n)');
    console.log('a1 断言全部通过。');
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
