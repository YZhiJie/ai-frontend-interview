/**
 * NODE-B3｜ES Module 模块：可变计数器（.mjs 后缀强制按 ESM 解析）
 *
 * ESM 的 import 是【实时绑定（live binding）】：
 * 引入方拿到的不是快照，而是指向模块内部变量的引用，
 * 模块内部通过 inc() 修改后，外部 import 的 count 读到的是最新值。
 *
 * 注意：绑定是只读的——外部只能读、不能赋值（count++ 在引入方会报错），
 * 修改变量必须通过模块导出的函数进行。
 */

export let count = 0;

export function inc() {
  count += 1;
  return count;
}

export function getCount() {
  return count;
}
