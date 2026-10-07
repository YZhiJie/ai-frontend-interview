/**
 * 对应题号：JS-B4｜Promise 基础执行顺序（微任务 vs 宏任务）
 * 运行命令：npx tsx 01-javascript/b4-promise-order.ts
 *
 * 以下为文档原题代码。Node v24.17.0 实跑的真实输出顺序：
 *   start → end → then → timeout
 * 与文档参考答案完全一致。
 *
 * 事件循环节奏：
 *   同步阶段       ：start → end；期间宏任务队列=[timeout]，微任务队列=[then]
 *   清空微任务队列 ：then（同步代码一结束就执行）
 *   取一个宏任务   ：timeout（delay=0 也要等下一轮循环，无法抢占微任务）
 */

// ============ 文档原题（原样运行） ============
console.log('start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('then'));
console.log('end');

// ============ 同结构代码再跑一遍，收集输出并用 node:assert 断言 ============
import assert from 'node:assert';

const seq: string[] = [];
const log = (msg: string): void => {
    seq.push(msg);
};

setTimeout(() => {
    log('timeout');
}, 0);
Promise.resolve().then(() => log('then'));
log('start');
log('end');

setTimeout(() => {
    assert.deepStrictEqual(seq, ['start', 'end', 'then', 'timeout']);
    console.log('\n断言通过：真实输出顺序为 start → end → then → timeout');
}, 10);
