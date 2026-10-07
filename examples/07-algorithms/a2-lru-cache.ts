/**
 * 对应题号：ALGO-A2｜LRU 缓存：哈希表 + 双向链表的 O(1) 设计
 * 运行命令：npx tsx 07-algorithms/a2-lru-cache.ts
 *
 * 两个实现：
 * 1. LRUCacheSimple：利用 Map 插入序，delete + set 等价于「移到末尾（最新）」
 * 2. LRUCache：哈希表 O(1) 定位 + 双向链表 O(1) 移动/删除，哑头哑尾哨兵消除边界特判
 * get / put 都算「使用」；容量超限时淘汰链表头部（最久未使用）的键。
 */

import assert from 'node:assert';

// ---------- ① Map 简化版 ----------
export class LRUCacheSimple {
    private map = new Map<number, number>();
    constructor(private readonly capacity: number) {
        if (capacity <= 0) throw new Error('capacity 必须大于 0');
    }

    get(key: number): number {
        if (!this.map.has(key)) return -1;
        const val = this.map.get(key)!;
        this.map.delete(key); // 删除旧位置
        this.map.set(key, val); // 重新插入到末尾 = 最近使用
        return val;
    }

    put(key: number, value: number): void {
        if (this.map.has(key)) this.map.delete(key); // 已存在也要先删，保证顺序更新
        this.map.set(key, value);
        if (this.map.size > this.capacity) {
            const oldest = this.map.keys().next().value!; // 插入序的首项 = 最久未使用
            this.map.delete(oldest);
        }
    }

    /** 测试辅助：按「旧 → 新」输出键序列 */
    keysOldToNew(): number[] {
        return [...this.map.keys()];
    }
}

// ---------- ② 哈希表 + 双向链表经典版 ----------
interface Node {
    key: number;
    val: number;
    prev: Node | null;
    next: Node | null;
}

export class LRUCache {
    private map = new Map<number, Node>(); // key → 链表节点，O(1) 定位
    private head: Node; // 哑头：head.next 是最旧节点
    private tail: Node; // 哑尾：tail.prev 是最新节点

    constructor(private readonly capacity: number) {
        if (capacity <= 0) throw new Error('capacity 必须大于 0');
        this.head = { key: -1, val: -1, prev: null, next: null };
        this.tail = { key: -1, val: -1, prev: null, next: null };
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    private remove(node: Node): void {
        node.prev!.next = node.next;
        node.next!.prev = node.prev;
    }

    private addToTail(node: Node): void {
        node.prev = this.tail.prev;
        node.next = this.tail;
        this.tail.prev!.next = node;
        this.tail.prev = node;
    }

    get(key: number): number {
        const node = this.map.get(key);
        if (!node) return -1;
        this.remove(node); // 摘下后插到尾部 = 提升为最近使用
        this.addToTail(node);
        return node.val;
    }

    put(key: number, value: number): void {
        const existed = this.map.get(key);
        if (existed) {
            existed.val = value;
            this.remove(existed);
            this.addToTail(existed);
            return;
        }
        if (this.map.size >= this.capacity) {
            const oldest = this.head.next!; // 淘汰最久未使用
            this.remove(oldest);
            this.map.delete(oldest.key); // 哈希表与链表同步删除
        }
        const fresh: Node = { key, val: value, prev: null, next: null };
        this.map.set(key, fresh);
        this.addToTail(fresh);
    }

    /** 测试辅助：按「旧 → 新」输出键序列 */
    keysOldToNew(): number[] {
        const keys: number[] = [];
        for (let cur = this.head.next; cur && cur !== this.tail; cur = cur.next) {
            keys.push(cur.key);
        }
        return keys;
    }
}

/** 对任一 LRU 实现跑同一组操作序列并断言 */
function verify(name: string, create: (capacity: number) => {
    get: (k: number) => number;
    put: (k: number, v: number) => void;
    keysOldToNew: () => number[];
}): void {
    console.log(`----- ${name} -----`);
    const cache = create(2);

    cache.put(1, 100);
    cache.put(2, 200);
    assert.deepStrictEqual(cache.keysOldToNew(), [1, 2]);
    assert.strictEqual(cache.get(1), 100, '命中 key=1');
    assert.deepStrictEqual(cache.keysOldToNew(), [2, 1], 'get(1) 后 1 提升为最新，淘汰顺序更新');

    cache.put(3, 300); // 容量 2，淘汰最久未使用的 key=2
    assert.strictEqual(cache.get(2), -1, 'key=2 已被淘汰');
    assert.deepStrictEqual(cache.keysOldToNew(), [1, 3]);

    cache.put(1, 111); // 已存在：更新值并提升为最新
    assert.strictEqual(cache.get(1), 111);
    assert.deepStrictEqual(cache.keysOldToNew(), [3, 1]);

    cache.put(4, 400); // 淘汰 key=3
    assert.strictEqual(cache.get(3), -1);
    assert.strictEqual(cache.get(1), 111);
    assert.strictEqual(cache.get(4), 400);
    assert.deepStrictEqual(cache.keysOldToNew(), [1, 4]);

    // get 未命中不得影响顺序
    assert.strictEqual(cache.get(99), -1);
    assert.deepStrictEqual(cache.keysOldToNew(), [1, 4]);
    console.log('操作序列：put1,put2,get1,put3,put1,put4,get99 全部符合预期，淘汰顺序 [1, 4]');
}

export function run(): void {
    console.log('ALGO-A2 LRU 缓存（Map 简化版 / 哈希表+双向链表版）');
    verify('Map 简化版', (cap) => new LRUCacheSimple(cap));
    verify('哈希表 + 双向链表经典版', (cap) => new LRUCache(cap));

    assert.throws(() => new LRUCacheSimple(0), /capacity/, 'capacity<=0 应抛错');
    assert.throws(() => new LRUCache(0), /capacity/);
    console.log('capacity <= 0 抛错断言通过');
    console.log('a2 断言全部通过。');
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
