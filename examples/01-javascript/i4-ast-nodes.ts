/**
 * 对应题号：JS-I4｜AST 结构识别
 * 运行命令：npx tsx 01-javascript/i4-ast-nodes.ts
 *
 * 把 `const x = 1 + 2;` 的精简 AST 以 JSON 对象写在代码中，
 * 用 node:assert 断言节点类型与层级关系，并打印 AST 树。
 *
 * 层级链：
 *   Program
 *     └─ VariableDeclaration (kind: const)
 *          └─ VariableDeclarator
 *               ├─ id:   Identifier (name: x)
 *               └─ init: BinaryExpression (operator: +)
 *                         ├─ left:  Literal (value: 1)
 *                         └─ right: Literal (value: 2)
 *
 * 常量折叠的入口：整体替换 VariableDeclarator.init 节点
 *   BinaryExpression(1 + 2) → Literal(3)
 */

import assert from 'node:assert';

// 精简 AST 节点类型定义（只保留本题涉及的字段）
interface LiteralNode {
    type: 'Literal';
    value: number;
    raw: string;
}
interface IdentifierNode {
    type: 'Identifier';
    name: string;
}
interface BinaryExpressionNode {
    type: 'BinaryExpression';
    operator: string;
    left: AstNode;
    right: AstNode;
}
interface VariableDeclaratorNode {
    type: 'VariableDeclarator';
    id: IdentifierNode;
    init: AstNode;
}
interface VariableDeclarationNode {
    type: 'VariableDeclaration';
    kind: 'var' | 'let' | 'const';
    declarations: VariableDeclaratorNode[];
}
interface ProgramNode {
    type: 'Program';
    body: VariableDeclarationNode[];
}
type AstNode = LiteralNode | IdentifierNode | BinaryExpressionNode | VariableDeclaratorNode | VariableDeclarationNode | ProgramNode;

// `const x = 1 + 2;` 解析后的精简 AST
const ast: ProgramNode = {
    type: 'Program',
    body: [
        {
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: 'x' },
                    init: {
                        type: 'BinaryExpression',
                        operator: '+',
                        left: { type: 'Literal', value: 1, raw: '1' },
                        right: { type: 'Literal', value: 2, raw: '2' },
                    },
                },
            ],
        },
    ],
};

// ============ 断言节点类型与层级 ============
assert.strictEqual(ast.type, 'Program');
assert.strictEqual(ast.body.length, 1);

const declaration = ast.body[0];
assert.strictEqual(declaration.type, 'VariableDeclaration');
assert.strictEqual(declaration.kind, 'const');

const declarator = declaration.declarations[0];
assert.strictEqual(declarator.type, 'VariableDeclarator');
assert.deepStrictEqual(declarator.id, { type: 'Identifier', name: 'x' });

const init = declarator.init;
assert.strictEqual(init.type, 'BinaryExpression');
if (init.type !== 'BinaryExpression') throw new Error('类型收窄');
assert.strictEqual(init.operator, '+');
assert.deepStrictEqual(init.left, { type: 'Literal', value: 1, raw: '1' });
assert.deepStrictEqual(init.right, { type: 'Literal', value: 2, raw: '2' });

// ============ 常量折叠：把 init 整体替换为 Literal(3) ============
function foldConstants(program: ProgramNode): ProgramNode {
    for (const decl of program.body) {
        for (const d of decl.declarations) {
            if (
                d.init.type === 'BinaryExpression' &&
                d.init.left.type === 'Literal' &&
                d.init.right.type === 'Literal'
            ) {
                const { left, right, operator } = d.init;
                // 仅折叠纯数字的 +/-/* 运算（演示常量折叠的判定思路）
                if (
                    typeof left.value === 'number' &&
                    typeof right.value === 'number' &&
                    operator in { '+': 1, '-': 1, '*': 1 }
                ) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const ops: Record<string, (a: number, b: number) => number> = {
                        '+': (a, b) => a + b,
                        '-': (a, b) => a - b,
                        '*': (a, b) => a * b,
                    };
                    const folded = ops[operator](left.value, right.value);
                    d.init = { type: 'Literal', value: folded, raw: String(folded) };
                }
            }
        }
    }
    return program;
}

foldConstants(ast);
assert.strictEqual(declarator.init.type, 'Literal');
assert.deepStrictEqual(declarator.init, { type: 'Literal', value: 3, raw: '3' });

// ============ 打印 AST 树 ============
function printTree(node: AstNode, prefix = '', isLast = true, isRoot = true): void {
    const branch = isRoot ? '' : isLast ? '└─ ' : '├─ ';
    let label = node.type;
    if (node.type === 'Literal') label += ` (value=${node.value}, raw="${node.raw}")`;
    if (node.type === 'Identifier') label += ` (name=${node.name})`;
    if (node.type === 'BinaryExpression') label += ` (operator=${node.operator})`;
    if (node.type === 'VariableDeclaration') label += ` (kind=${node.kind})`;
    console.log(prefix + branch + label);

    const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ');
    const children: Array<[string, AstNode]> = [];
    if (node.type === 'Program') node.body.forEach((b, i) => children.push([`body[${i}]`, b]));
    if (node.type === 'VariableDeclaration')
        node.declarations.forEach((d, i) => children.push([`declarations[${i}]`, d]));
    if (node.type === 'VariableDeclarator') {
        children.push(['id', node.id]);
        children.push(['init', node.init]);
    }
    if (node.type === 'BinaryExpression') {
        children.push(['left', node.left]);
        children.push(['right', node.right]);
    }
    children.forEach(([, child], idx) => {
        printTree(child, childPrefix, idx === children.length - 1, false);
    });
}

console.log('===== 常量折叠后的 AST 树（1 + 2 → 3） =====');
printTree(ast);
console.log('\n所有断言通过：节点类型、层级关系与常量折叠结果均正确。');
