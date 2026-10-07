/**
 * NODE-B3｜CommonJS 模块：可变计数器（.cjs 后缀强制按 CJS 解析）
 *
 * 模块格式判定规则（与本目录 esm-counter.mjs 对照）：
 *   - .mjs 恒为 ESM；.cjs 恒为 CommonJS
 *   - .js 看最近一层 package.json 的 "type"："module" 为 ESM，缺省为 commonjs
 *
 * CJS 的 require 在运行时执行，module.exports 导出的是【当前值的快照/引用拷贝】：
 * 基础类型导出后，模块内部再修改，引入方拿到的值不会变。
 */

let count = 0;

function inc() {
  count += 1;
  return count;
}

function getCount() {
  return count;
}

// 注意：这里导出的是 count【此刻的值】（数字是值拷贝），函数则是共享引用
module.exports = { count, inc, getCount };
