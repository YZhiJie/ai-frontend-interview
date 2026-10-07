/**
 * 对应题号：ALGO-B2｜冒泡排序原理与提前退出优化
 * 运行命令：npx tsx 07-algorithms/b2-bubble-sort.ts
 *
 * 原理：相邻元素两两比较，逆序则交换；每轮把未排序部分的最大值「冒泡」到末尾。
 * flag 优化：某轮没有发生任何交换说明数组已完全有序，直接 break；最好情况降为 O(n)。
 * 文档用例 [5, 1, 4, 2, 8] 的每轮结果：
 *   第 1 轮 [1, 4, 2, 5, 8]
 *   第 2 轮 [1, 2, 4, 5, 8]
 *   第 3 轮无交换，提前退出
 */

import assert from 'node:assert';

/** 冒泡排序（原地，含提前退出），通过 onPass 回调观察每轮结束后的数组 */
export function bubbleSort(
    arr: number[],
    onPass?: (passIndex: number, snapshot: number[], swapped: boolean) => void,
): number[] {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let swapped = false; // 本轮是否发生交换
        for (let j = 0; j < n - 1 - i; j++) {
            // 尾部 i 个元素已就位，内层边界随 i 递减
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swapped = true;
            }
        }
        onPass?.(i + 1, [...arr], swapped);
        if (!swapped) break; // 一整轮无交换 = 整体有序
    }
    return arr;
}

function isSorted(arr: number[]): boolean {
    return arr.every((v, i) => i === 0 || arr[i - 1] <= v);
}

export function run(): void {
    console.log('ALGO-B2 冒泡排序（提前退出优化）');

    // ---------- 文档用例：逐轮打印 ----------
    const docCase = [5, 1, 4, 2, 8];
    console.log(`输入：[${docCase.join(', ')}]`);
    const snapshots: number[][] = [];
    bubbleSort(docCase, (pass, snapshot, swapped) => {
        snapshots.push(snapshot);
        console.log(`第 ${pass} 轮结束：[${snapshot.join(', ')}]（本轮${swapped ? '有交换' : '无交换 → break'}）`);
    });
    assert.deepStrictEqual(snapshots[0], [1, 4, 2, 5, 8]);
    assert.deepStrictEqual(snapshots[1], [1, 2, 4, 5, 8]);
    assert.strictEqual(snapshots.length, 3, '第 3 轮无交换提前退出，共观察到 3 轮');

    // ---------- 用例二：完全逆序 ----------
    const reversed = [5, 4, 3, 2, 1];
    bubbleSort(reversed);
    assert.deepStrictEqual(reversed, [1, 2, 3, 4, 5]);
    console.log(`逆序输入排序结果：[${reversed.join(', ')}]`);

    // ---------- 用例三：已排序输入只跑一轮（最好情况 O(n)） ----------
    const sorted = [1, 2, 3, 4, 5];
    let passCount = 0;
    bubbleSort(sorted, () => {
        passCount += 1;
    });
    assert.strictEqual(passCount, 1, '已有序时仅第 1 轮跑完即退出，最好情况 O(n)');
    console.log(`已排序输入只执行 ${passCount} 轮即提前退出（O(n)）`);

    // ---------- 用例四：含重复元素，验证稳定性场景下结果仍正确 ----------
    const withDup = [3, 1, 3, 2, 1];
    bubbleSort(withDup);
    assert.ok(isSorted(withDup));
    console.log(`含重复元素结果：[${withDup.join(', ')}]`);

    console.log('b2 断言全部通过。');
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
