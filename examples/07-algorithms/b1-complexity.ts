/**
 * 对应题号：ALGO-B1｜时间复杂度与空间复杂度：读懂大 O 记号
 * 运行命令：npx tsx 07-algorithms/b1-complexity.ts
 *
 * 用实际计时 + 操作计数对比 O(n²) 与 O(n log n) 在 1k / 1w / 5w 规模下的表现。
 * 说明：
 * - O(n²) 实跑 1k、1w；5w 规模（约 12.5 亿次比较）实跑需十余秒，
 *   改为先用一段固定规模循环标定「单次操作耗时」，再外推（表中标注「外推」），避免自测卡太久
 * - O(n log n) 用语言内置 sort（V8 TimSort）统计真实比较次数
 */

import assert from 'node:assert';
import { performance } from 'node:perf_hooks';

/** 生成 0..n-1 的随机数组（Fisher-Yates 洗牌） */
function randomArray(n: number): number[] {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** O(n²)：暴力统计「逆序对」（双重循环），返回比较操作次数 */
function countInversionsBruteForce(arr: number[]): { inversions: number; ops: number } {
    let inversions = 0;
    let ops = 0;
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            ops += 1;
            if (arr[i] > arr[j]) inversions += 1;
        }
    }
    return { inversions, ops };
}

/** O(n log n)：排序并统计比较器被调用的次数（近似 n log n 次操作） */
function sortWithOps(arr: number[]): { ops: number } {
    let ops = 0;
    arr.sort((a, b) => {
        ops += 1;
        return a - b;
    });
    return { ops };
}

function fmt(n: number): string {
    return n.toLocaleString('en-US');
}

export function run(): void {
    const sizes = [1000, 10000, 50000];

    // 标定 O(n²) 单次内层操作耗时：跑 4000 × 50000 = 2 亿次操作
    const probeRows = 50000;
    const probeCols = 4000;
    const probeOps = probeRows * probeCols;
    const t0 = performance.now();
    let sink = 0;
    for (let i = 0; i < probeCols; i++) {
        for (let j = 0; j < probeRows; j++) {
            sink += i > j ? 1 : 0;
        }
    }
    const nsPerOp = ((performance.now() - t0) / probeOps) * 1e6;
    void sink;

    console.log('ALGO-B1 复杂度实测（操作计数 + 耗时）');
    console.log('增长速度排序：O(1) < O(log n) < O(n) < O(n log n) < O(n²)');
    console.log('-'.repeat(86));
    console.log('   规模 n |  O(n²) 操作数        | O(n²) 耗时      | O(n log n) 操作数 | 实际耗时');
    console.log('-'.repeat(86));

    for (const n of sizes) {
        const theoreticalOps = (n * (n - 1)) / 2; // 逆序对双重循环的精确比较次数

        let quadraticMs: number;
        let extrapolated = false;
        if (n <= 10000) {
            const input = randomArray(n);
            const start = performance.now();
            const { ops } = countInversionsBruteForce(input);
            quadraticMs = performance.now() - start;
            assert.strictEqual(ops, theoreticalOps, 'O(n²) 操作数应精确等于 n(n-1)/2');
        } else {
            // 5w 规模：用标定的单位耗时外推（标注「外推」）
            quadraticMs = (theoreticalOps * nsPerOp) / 1e6;
            extrapolated = true;
        }

        const input2 = randomArray(n);
        const start2 = performance.now();
        const { ops: nlognOps } = sortWithOps(input2);
        const nlognMs = performance.now() - start2;
        assert.ok(input2.every((v, i) => i === 0 || input2[i - 1] <= v), '排序结果必须升序');

        const nlognTheory = n * Math.log2(n);
        assert.ok(nlognOps > n, '比较次数应显著大于 n');
        assert.ok(nlognOps < 4 * nlognTheory, 'TimSort 随机输入的比较次数应与 n log n 同阶');

        console.log(
            `${fmt(n).padStart(8)} | ${fmt(theoreticalOps).padStart(20)} | ${quadraticMs
                .toFixed(1)
                .padStart(9)} ms${extrapolated ? '（外推）' : '     '} | ${fmt(nlognOps).padStart(17)} | ${nlognMs
                .toFixed(2)
                .padStart(7)} ms`,
        );
    }
    console.log('-'.repeat(86));
    console.log('读表方式：n 从 1w 增到 5w（5 倍），O(n²) 操作数增长约 25 倍，O(n log n) 仅增长约 5.6 倍；');
    console.log('大 O 忽略常数项与低阶项，描述的是 n 增大时的增长趋势，而非精确耗时。');
    console.log('空间复杂度同理：原地排序 O(1)、归并 O(n)、递归还要计入调用栈深度 O(log n)。');
    console.log('b1 断言全部通过。');
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
