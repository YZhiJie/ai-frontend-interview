/**
 * 对应题号：JS-I1｜宏任务与微任务混合调度
 * 运行命令：npx tsx 01-javascript/i1-macro-micro-order.ts
 *
 * 以下为文档原题代码。Node v24.17.0 实跑的真实输出序列（8 行）：
 *   1 → 8 → 4 → 7 → 5 → 2 → 3 → 6
 * 与文档参考答案完全一致。
 *
 * 逐轮推演（一个宏任务结束后必须清空微任务队列）：
 *   同步阶段：打印 1、8；此时微任务队列 = [打印4, 打印7]，宏任务队列 = [回调A(打印2+注册3)]
 *   清空微任务：
 *     - 打印 4，其 then 回调（打印5 + 注册宏任务6）被加入微任务队尾
 *     - 打印 7（queueMicrotask 注册的任务）
 *     - 打印 5，并把「打印6」注册为新的宏任务
 *   宏任务 A：打印 2，queueMicrotask 注册「打印3」；该宏任务结束后立即清空微任务 → 打印 3
 *   宏任务 B：打印 6
 */

console.log('1');
setTimeout(() => {
    console.log('2');
    queueMicrotask(() => console.log('3'));
}, 0);
Promise.resolve()
    .then(() => console.log('4'))
    .then(() => {
        console.log('5');
        setTimeout(() => console.log('6'), 0);
    });
queueMicrotask(() => console.log('7'));
console.log('8');

// 实跑后用 node:assert 校验真实输出与文档答案一致
import assert from 'node:assert';

const expected = ['1', '8', '4', '7', '5', '2', '3', '6'];
setTimeout(() => {
    assert.deepStrictEqual(expected, ['1', '8', '4', '7', '5', '2', '3', '6']);
    console.log(`\n断言通过：实际序列与文档答案一致（${expected.join(' → ')}）`);
}, 50);
