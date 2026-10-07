/**
 * NODE-B3｜ESM 消费方（.mjs）
 * 运行：node modules/esm-consumer.mjs
 *
 * 关键：本文件没有 package.json，.mjs 后缀本身就决定它按 ESM 解析；
 * 若改成 .js，则需要在最近的 package.json 中声明 "type": "module"。
 */

import { count, inc, getCount } from './esm-counter.mjs';

console.log('========== ESM：实时绑定（live binding） ==========');
console.log('刚 import 时 count =', count, '（0）');

inc();
inc();
inc();
console.log('调用 inc() 三次后：');
console.log('  count      =', count, '← 为 3：import 的是实时绑定，读到模块内部最新值');
console.log('  getCount() =', getCount(), '← 为 3');
console.log();
console.log('注意：绑定是只读的。若在本文件执行 count++，会抛');
console.log('      "Assignment to constant variable"，修改只能走导出的 inc()。');
