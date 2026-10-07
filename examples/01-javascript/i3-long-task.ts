/**
 * 对应题号：JS-I3｜单线程模型对前端性能的影响与优化策略
 * 运行命令：npx tsx 01-javascript/i3-long-task.ts
 *
 * 演示内容：
 * 1. 同步长任务霸占主线程约 500ms：期间 setInterval「心跳」完全无法响应（输入框/按钮卡顿的根因）
 * 2. 分片调度 chunkTasks：把同等计算量切成 < 一帧的小块，每块之间用 MessageChannel 让出主线程，
 *    心跳可以穿插执行，单次阻塞降到 10ms 量级
 * 3. yieldToMain：让出主线程的工具函数（MessageChannel 优先，setTimeout 兜底），无需 Worker 依赖
 */

import assert from 'node:assert';
import { performance } from 'node:perf_hooks';

/** 纯 CPU 忙等，模拟同步计算（如大表格聚合） */
function busyWork(ms: number): void {
    const end = performance.now() + ms;
    let n = 0;
    while (performance.now() < end) {
        n += 1; // 防止引擎优化掉空循环
    }
    void n;
}

/** 让出主线程：MessageChannel 宏任务（比 setTimeout(0) 的 1ms 下限更及时），不支持时退回 setTimeout */
function yieldToMain(): Promise<void> {
    if (typeof MessageChannel !== 'undefined') {
        return new Promise((resolve) => {
            const { port1, port2 } = new MessageChannel();
            port1.onmessage = () => {
                port1.close();
                resolve();
            };
            port2.postMessage(null);
        });
    }
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/** 长任务分片：每片最多占用 chunkBudgetMs，随后让出主线程，使高优先级事件能插队 */
async function chunkTasks<T>(
    items: T[],
    run: (item: T, index: number) => void,
    chunkBudgetMs = 8,
): Promise<number> {
    let chunks = 0;
    for (let i = 0; i < items.length; ) {
        const chunkEnd = performance.now() + chunkBudgetMs;
        chunks += 1;
        do {
            run(items[i], i);
            i += 1;
        } while (i < items.length && performance.now() < chunkEnd);
        await yieldToMain(); // 片间让出主线程，浏览器此时可以响应输入/点击/渲染
    }
    return chunks;
}

/** 心跳：模拟用户交互事件能被处理的频率；记录两次心跳的最大间隔（近似最长阻塞） */
function startHeartbeat(intervalMs: number): {
    beats: number[];
    maxGap: () => number;
    stop: () => void;
    startAt: number;
} {
    const startAt = performance.now();
    const beats: number[] = [];
    const timer = setInterval(() => beats.push(performance.now() - startAt), intervalMs);
    return {
        beats,
        startAt,
        maxGap: () => {
            const points = [0, ...beats, performance.now() - startAt];
            let gap = 0;
            for (let i = 1; i < points.length; i++) gap = Math.max(gap, points[i] - points[i - 1]);
            return gap;
        },
        stop: () => clearInterval(timer),
    };
}

async function main(): Promise<void> {
    // ============ 场景一：同步阻塞 ~500ms ============
    console.log('===== 场景一：同步长任务（busyWork 500ms） =====');
    const hb1 = startHeartbeat(10); // 期望每 10ms 一次「交互响应」
    const t1Start = performance.now();
    busyWork(500); // 一个 500ms 的 Long Task，事件循环被卡死
    hb1.stop();
    const t1Cost = performance.now() - t1Start;
    console.log(`同步计算耗时：${t1Cost.toFixed(1)}ms`);
    console.log(`阻塞期间心跳触发次数：${hb1.beats.length}（全部被推迟到长任务结束后）`);
    console.log(`心跳最大间隔：${hb1.maxGap().toFixed(1)}ms（≈ 用户感知到的无响应时长）`);
    assert.strictEqual(hb1.beats.length, 0, '500ms 同步执行期间事件循环无机会处理任何定时器回调');
    assert.ok(hb1.maxGap() >= 450, '心跳最大间隔应接近整个长任务时长');

    // ============ 场景二：同等计算量，分片 + 让出主线程 ============
    console.log('\n===== 场景二：分片调度（每片预算 8ms，片间 MessageChannel 让出） =====');
    // 50 个小任务，每个忙等 10ms，总计算量仍为 500ms
    const items = Array.from({ length: 50 }, (_, i) => i);
    const hb2 = startHeartbeat(10);
    const t2Start = performance.now();
    const chunkCount = await chunkTasks(items, () => busyWork(10), 8);
    hb2.stop();
    const t2Cost = performance.now() - t2Start;
    console.log(`分片执行总耗时：${t2Cost.toFixed(1)}ms（计算量相同，多出的是让出/调度开销）`);
    console.log(`共切分为 ${chunkCount} 片，阻塞期间心跳触发 ${hb2.beats.length} 次`);
    console.log(`心跳最大间隔：${hb2.maxGap().toFixed(1)}ms（单块远小于 50ms 的长任务门槛）`);
    assert.ok(chunkCount >= 40, '500ms 计算量按 8ms 预算应被切成数十片');
    assert.ok(hb2.beats.length > 20, '片间让出后心跳可以穿插执行');
    assert.ok(hb2.maxGap() < 100, '单次连续占用主线程的时间应显著小于同步版本');

    console.log('\n===== 优化策略对照（JS-I3 考点） =====');
    console.log('1. 长任务分片：setTimeout / MessageChannel / scheduler.postTask 让出主线程（本文件演示），代价是总耗时略增；');
    console.log('2. Web Worker：CSV 解析、聚合、加解密等无 DOM 依赖的纯计算移出主线程，代价是 postMessage 通信开销；');
    console.log('3. 时间切片：React Fiber 式按优先级分帧，低优先级任务交给 requestIdleCallback；');
    console.log('4. 防抖/节流：降低 resize/scroll/input 高频事件的触发频率（见 b3-closure.ts 的 debounce）。');
    console.log('\n全部断言通过：同步版本心跳饿死，分片版本交互不再被长时间阻塞。');
}

main();
