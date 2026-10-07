/**
 * 对应题号：JS-B5｜var 与 let 在循环 + setTimeout 中的输出差异
 * 运行命令：npx tsx 01-javascript/b5-var-let-loop.ts
 *
 * 真实输出（Node v24 实跑）：
 *   var: 3
 *   var: 3
 *   var: 3
 *   let: 0
 *   let: 1
 *   let: 2
 *
 * 原因：
 * - var 是函数/全局作用域，整个循环共享同一个 i 绑定；同步循环结束时 i 已为 3，回调执行时全部读到 3
 * - let 在 for 循环中存在 per-iteration binding：每轮迭代基于上一轮的值创建新的块级词法环境，
 *   三个回调各自捕获当轮的 j，因此输出 0、1、2
 */

console.log('===== var 版：3 个回调共享同一个 i =====');
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log('var:', i), 0);
}

console.log('===== let 版：每轮迭代一个新的 j 绑定 =====');
for (let j = 0; j < 3; j++) {
    setTimeout(() => console.log('let:', j), 0);
}

console.log('===== 同步阶段结束（本行先于所有 setTimeout 回调打印） =====');

// 经典修复手段：var 时代用 IIFE 给每个回调造一个独立作用域
for (var k = 0; k < 3; k++) {
    ((captured: number) => {
        setTimeout(() => console.log('iife:', captured), 0);
    })(k);
}

import assert from 'node:assert';

setTimeout(() => {
    console.log('\n===== 断言：用直接读取循环结束后变量的方式验证共享绑定 =====');
    assert.strictEqual(i, 3, 'var 循环结束后全局 i 等于 3，所有回调闭包读到的都是它');
    // @ts-expect-error j 是循环块级绑定，外部不可见——这里仅为演示作用域差异
    assert.strictEqual(typeof j, 'undefined');
    console.log('断言通过：var 的 i 泄漏到外层且为 3；let 的 j 在循环外不可见');
}, 10);
