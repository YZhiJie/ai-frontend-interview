/**
 * NODE-B3｜CommonJS 消费方（.cjs）
 * 运行：node modules/cjs-consumer.cjs
 */

const counter = require('./cjs-counter.cjs');
const { count: destructuredCount, inc, getCount } = counter;

console.log('========== CommonJS：值拷贝 ==========');
console.log('刚 require 时 counter.count =', counter.count, '（导出那一刻的快照：0）');

inc();
inc();
inc();
console.log('调用 inc() 三次后：');
console.log('  counter.count      =', counter.count, '← 仍是 0：导出对象上的属性不会被回写');
console.log('  解构出来的 count    =', destructuredCount, '← 仍是 0：数字在解构时已完成值拷贝');
console.log('  getCount()         =', getCount(), '← 为 3：函数闭包读取的是模块内部实时变量');
console.log('  counter.inc === inc :', counter.inc === inc, '（函数是共享的同一个引用）');
