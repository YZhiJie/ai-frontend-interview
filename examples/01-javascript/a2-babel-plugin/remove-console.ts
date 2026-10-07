/**
 * 对应题号：JS-A2｜Babel 编译流程中 AST 的深度应用
 *
 * 运行方式（两步）：
 *   1. 安装依赖（在本子目录内执行）：
 *      pnpm install --registry=https://registry.npmmirror.com
 *   2. 回到 examples 根目录运行（npx 会找到根 node_modules/.bin/tsx）：
 *      npx tsx 01-javascript/a2-babel-plugin/remove-console.ts
 *
 * 本脚本演示 Babel 三段式流水线：
 *   parse（@babel/parser 源码 → AST）
 * → transform（@babel/traverse + visitor 增删改节点）
 * → generate（@babel/generator AST → 代码）
 *
 * 插件规则（与文档参考答案一致）：
 *   - 语句位置的 console.* 调用：整条 ExpressionStatement 删除
 *   - 作为表达式使用的 console.* 调用：替换为 void 0，保证替换后语法仍然合法
 *   - 不碰 obj.log()、window.console.log() 等非「裸 console」调用
 */

import { parse } from '@babel/parser';
// @babel/traverse / @babel/generator 的 ESM 入口为 default 导出，做一次兼容取值
// 边界处使用 as unknown as：这两个包是 CJS/ESM 双入口，tsx 下 default 形态可能为函数或 { default }
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import assert from 'node:assert';

type TraverseFn = typeof import('@babel/traverse').default;
type GenerateFn = typeof import('@babel/generator').default;

const traverse: TraverseFn =
    (_traverse as unknown as { default?: TraverseFn }).default ?? (_traverse as unknown as TraverseFn);
const generate: GenerateFn =
    (_generate as unknown as { default?: GenerateFn }).default ?? (_generate as unknown as GenerateFn);

/** 「去除 console」插件本体：返回一个 visitor，可直接交给 traverse 使用 */
function removeConsolePlugin() {
    return {
        name: 'remove-console',
        visitor: {
            CallExpression(path: NodePath<t.CallExpression>) {
                const callee = path.get('callee');
                // 仅匹配 console.xxx(...) 这种成员调用，且 object 必须是裸标识符 console
                const isConsole = callee.isMemberExpression() && callee.get('object').isIdentifier({ name: 'console' });
                if (!isConsole) return;

                if (path.parentPath.isExpressionStatement()) {
                    path.remove(); // 语句位置：整条删除
                } else {
                    path.replaceWith(t.unaryExpression('void', t.numericLiteral(0))); // 表达式位置：换成 void 0
                }
            },
        },
    };
}

function transform(source: string): string {
    // ① parse：源码 → AST
    const ast = parse(source, { sourceType: 'module' });

    // ② transform：visitor 深度优先遍历 AST 并改写节点
    traverse(ast, removeConsolePlugin().visitor);

    // ③ generate：AST → 代码
    return generate(ast, { retainLines: false }).code;
}

const source = `
function demo(a) {
  console.log('语句位置的调用，应被整条删除');
  console.error('同样删除', a);
  logger.log('不是裸 console，保留');
  const used = console.warn('表达式位置，替换为 void 0') ?? 'fallback';
  return used;
}
console.table([1, 2]);
demo(1);
`;

const result = transform(source);

console.log('========== 转换前 ==========\n' + source.trim());
console.log('========== 转换后 ==========\n' + result.trim());

// ============ 断言：删除/替换/保留三类行为都正确 ============
assert.ok(!result.includes('console.log'), 'console.log 语句应被删除');
assert.ok(!result.includes('console.error'), 'console.error 语句应被删除');
assert.ok(!result.includes('console.table'), 'console.table 语句应被删除');
assert.ok(!result.includes('console.warn'), '表达式位置的 console.warn 应被替换');
assert.ok(result.includes('void 0'), '表达式位置应替换为 void 0');
assert.ok(result.includes('logger.log'), '非裸 console 的成员调用必须保留');
assert.ok(result.includes("'fallback'"), '替换后与 ?? 组合的语法仍然合法');

console.log('\n全部断言通过：语句位置 console.* 已删除，表达式位置替换为 void 0，其余调用保持不变。');
