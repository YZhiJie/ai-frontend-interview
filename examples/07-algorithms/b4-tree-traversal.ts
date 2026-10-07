/**
 * 对应题号：ALGO-B4｜二叉树前/中/后序遍历（递归与迭代）
 * 运行命令：npx tsx 07-algorithms/b4-tree-traversal.ts
 *
 * 遍历定义：前序=根左右、中序=左根右、后序=左右根
 * 递归版只有「访问根」的位置不同；迭代版用显式栈模拟递归，不受 JS 调用栈深度限制。
 * 复杂度：时间 O(n)，空间 O(h)，h 为树高。
 *
 * 测试用树：
 *         1
 *        / \
 *       2   3
 *      / \   \
 *     4   5   6
 */

import assert from 'node:assert';

export class TreeNode<T> {
    val: T;
    left: TreeNode<T> | null;
    right: TreeNode<T> | null;
    constructor(val: T, left: TreeNode<T> | null = null, right: TreeNode<T> | null = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

// ---------- 递归版 ----------
export function preorderRecursive<T>(root: TreeNode<T> | null, res: T[] = []): T[] {
    if (!root) return res;
    res.push(root.val); // 根
    preorderRecursive(root.left, res); // 左
    preorderRecursive(root.right, res); // 右
    return res;
}

export function inorderRecursive<T>(root: TreeNode<T> | null, res: T[] = []): T[] {
    if (!root) return res;
    inorderRecursive(root.left, res); // 左
    res.push(root.val); // 根
    inorderRecursive(root.right, res); // 右
    return res;
}

export function postorderRecursive<T>(root: TreeNode<T> | null, res: T[] = []): T[] {
    if (!root) return res;
    postorderRecursive(root.left, res); // 左
    postorderRecursive(root.right, res); // 右
    res.push(root.val); // 根
    return res;
}

// ---------- 迭代版 ----------
/** 中序迭代：沿左链入栈 → 弹出访问 → 转向右子树 */
export function inorderIterative<T>(root: TreeNode<T> | null): T[] {
    const res: T[] = [];
    const stack: TreeNode<T>[] = [];
    let cur: TreeNode<T> | null = root;
    while (cur || stack.length) {
        while (cur) {
            stack.push(cur);
            cur = cur.left;
        }
        cur = stack.pop()!;
        res.push(cur.val);
        cur = cur.right;
    }
    return res;
}

/** 前序迭代：用栈时「先压右再压左」，保证弹出顺序为根左右 */
export function preorderIterative<T>(root: TreeNode<T> | null): T[] {
    if (!root) return [];
    const res: T[] = [];
    const stack: TreeNode<T>[] = [root];
    while (stack.length) {
        const node = stack.pop()!;
        res.push(node.val);
        if (node.right) stack.push(node.right);
        if (node.left) stack.push(node.left);
    }
    return res;
}

/** 后序迭代：前序变形「根右左」入栈收集，再整体反转得「左右根」 */
export function postorderIterative<T>(root: TreeNode<T> | null): T[] {
    if (!root) return [];
    const res: T[] = [];
    const stack: TreeNode<T>[] = [root];
    while (stack.length) {
        const node = stack.pop()!;
        res.push(node.val);
        if (node.left) stack.push(node.left);
        if (node.right) stack.push(node.right);
    }
    return res.reverse();
}

export function run(): void {
    console.log('ALGO-B4 二叉树遍历（递归 + 迭代）');
    const root = new TreeNode(
        1,
        new TreeNode(2, new TreeNode(4), new TreeNode(5)),
        new TreeNode(3, null, new TreeNode(6)),
    );

    const preExpected = [1, 2, 4, 5, 3, 6];
    const inExpected = [4, 2, 5, 1, 3, 6];
    const postExpected = [4, 5, 2, 6, 3, 1];

    console.log('前序（根左右）：', preorderRecursive(root));
    console.log('中序（左根右）：', inorderRecursive(root));
    console.log('后序（左右根）：', postorderRecursive(root));

    assert.deepStrictEqual(preorderRecursive(root), preExpected);
    assert.deepStrictEqual(inorderRecursive(root), inExpected);
    assert.deepStrictEqual(postorderRecursive(root), postExpected);

    // 递归与迭代结果必须一致
    assert.deepStrictEqual(preorderIterative(root), preExpected);
    assert.deepStrictEqual(inorderIterative(root), inExpected);
    assert.deepStrictEqual(postorderIterative(root), postExpected);
    console.log('前/中/后序的迭代版与递归版结果全部一致');

    // 空树与单节点
    assert.deepStrictEqual(inorderIterative(null), []);
    assert.deepStrictEqual(preorderIterative(new TreeNode(9)), [9]);
    assert.deepStrictEqual(postorderIterative(new TreeNode(9)), [9]);
    console.log('空树 / 单节点边界用例通过');

    // BST 性质验证：二叉搜索树的中序遍历是有序序列
    const bst = new TreeNode(
        4,
        new TreeNode(2, new TreeNode(1), new TreeNode(3)),
        new TreeNode(6, new TreeNode(5), new TreeNode(7)),
    );
    assert.deepStrictEqual(inorderRecursive(bst), [1, 2, 3, 4, 5, 6, 7]);
    console.log('BST 中序遍历得有序序列：[1, 2, 3, 4, 5, 6, 7]');
    console.log('b4 断言全部通过。');
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
