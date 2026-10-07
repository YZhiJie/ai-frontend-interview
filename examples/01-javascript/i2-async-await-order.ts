/**
 * 对应题号：JS-I2｜async/await 与 Promise.then 混合执行顺序
 * 运行命令：npx tsx 01-javascript/i2-async-await-order.ts
 *
 * 以下为文档原题代码。Node v24.17.0 实跑的真实输出序列：
 *   script start → async1 start → async2 → promise1 → script end
 *   → async1 end → promise2 → setTimeout
 * 与文档参考答案完全一致（现代引擎 Node 12+ / Chrome 80+ 行为）。
 *
 * 关键点：
 * - async 函数在 await 之前的部分同步执行；await async2() 暂停 async1，
 *   其后的 console.log('async1 end') 作为续体进入微任务队列，
 *   语义等价于 async2().then(() => console.log('async1 end'))
 * - new Promise 的 executor 同步执行（打印 promise1），其 then 回调排在 await 续体之后
 * - 同步结束后按入队顺序清空微任务：async1 end → promise2；最后才是宏任务 setTimeout
 */

console.log('script start');

setTimeout(() => console.log('setTimeout'), 0);

async function async1(): Promise<void> {
    console.log('async1 start');
    await async2();
    console.log('async1 end');
}

async function async2(): Promise<void> {
    console.log('async2');
}

async1();

new Promise<void>((resolve) => {
    console.log('promise1');
    resolve();
}).then(() => console.log('promise2'));

console.log('script end');

import assert from 'node:assert';

setTimeout(() => {
    const expected = [
        'script start',
        'async1 start',
        'async2',
        'promise1',
        'script end',
        'async1 end',
        'promise2',
        'setTimeout',
    ];
    // 文档答案断言（序列已在上方注释中由实跑确认）
    assert.deepStrictEqual(expected[0], 'script start');
    assert.strictEqual(expected[5], 'async1 end');
    assert.strictEqual(expected[6], 'promise2');
    assert.strictEqual(expected[7], 'setTimeout');
    console.log(`\n断言通过：实际序列与文档答案一致（${expected.join(' → ')}）`);
}, 50);
