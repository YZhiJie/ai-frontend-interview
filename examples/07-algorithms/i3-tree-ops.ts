/**
 * 对应题号：ALGO-I3｜二叉树经典三连：翻转、最大深度、最近公共祖先
 * 运行命令：npx tsx 07-algorithms/i3-tree-ops.ts
 *
 * 递归套路：先写空节点出口，再用子问题答案拼当前答案。
 * 三个操作时间均为 O(n)、空间 O(h)。
 *
 * 测试用树：
 *          3
 *         / \
 *        5   1
 *       / \   \
 *      6   2   8
 *         / \
 *        7   4
 */

import assert from 'node:assert';
import { TreeNode } from './b4-tree-traversal';
import { inorderRecursive } from './b4-tree-traversal';

/** ① 翻转二叉树（镜像）：交换左右孩子后递归翻转子树 */
export function invertTree<T>(root: TreeNode<T> | null): TreeNode<T> | null {
    if (!root) return null;
    [root.left, root.right] = [root.right, root.left];
    invertTree(root.left);
    invertTree(root.right);
    return root;
}

/** ② 最大深度：自底向上聚合 1 + max(左深, 右深) */
export function maxDepth<T>(root: TreeNode<T> | null): number {
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

/** ③ 最近公共祖先（普通二叉树，非 BST）：前提 p、q 均在树中 */
export function lowestCommonAncestor<T>(root: TreeNode<T> | null, p: TreeNode<T>, q: TreeNode<T>): TreeNode<T> | null {
    if (!root || root === p || root === q) return root; // 命中 p/q 或走到空
    const left = lowestCommonAncestor(root.left, p, q);
    const right = lowestCommonAncestor(root.right, p, q);
    if (left && right) return root; // p、q 分居两侧，当前节点即最深分叉点
    return left || right; // 同侧则返回非空一侧
}

function buildSampleTree(): {
    root: TreeNode<number>;
    n5: TreeNode<number>;
    n1: TreeNode<number>;
    n6: TreeNode<number>;
    n2: TreeNode<number>;
    n7: TreeNode<number>;
    n4: TreeNode<number>;
    n8: TreeNode<number>;
} {
    const n6 = new TreeNode(6);
    const n7 = new TreeNode(7);
    const n4 = new TreeNode(4);
    const n2 = new TreeNode(2, n7, n4);
    const n8 = new TreeNode(8);
    const n5 = new TreeNode(5, n6, n2);
    const n1 = new TreeNode(1, null, n8);
    const root = new TreeNode(3, n5, n1);
    return { root, n5, n1, n6, n2, n7, n4, n8 };
}

export function run(): void {
    console.log('ALGO-I3 翻转二叉树 / 最大深度 / 最近公共祖先');
    const { root, n5, n1, n6, n2, n7, n4, n8 } = buildSampleTree();

    // ---------- 最大深度 ----------
    assert.strictEqual(maxDepth(root), 4, '树高为 4 层（3→5→2→7）');
    assert.strictEqual(maxDepth(null), 0);
    assert.strictEqual(maxDepth(new TreeNode(1)), 1);
    console.log('最大深度：4（空树 0、单节点 1 的边界也已断言）');

    // ---------- 最近公共祖先 ----------
    assert.strictEqual(lowestCommonAncestor(root, n6, n4), n5, '6 与 4 的 LCA 是 5（6 是 2 的兄弟，二者分叉于 5）');
    assert.strictEqual(lowestCommonAncestor(root, n6, n8), root, '6 与 8 的 LCA 是根 3');
    assert.strictEqual(lowestCommonAncestor(root, n7, n4), n2, '7 与 4 的 LCA 是 2');
    assert.strictEqual(lowestCommonAncestor(root, n5, n4), n5, '其中一个节点是另一个祖先时返回祖先本身');
    assert.strictEqual(lowestCommonAncestor(root, n7, n2), n2);
    console.log('LCA(6,4)=5、LCA(6,8)=3、LCA(7,4)=2、LCA(5,4)=5，全部符合预期');

    // ---------- 翻转二叉树 ----------
    const before = inorderRecursive(root);
    invertTree(root);
    const after = inorderRecursive(root);
    assert.deepStrictEqual(after, [...before].reverse(), '翻转后中序遍历结果恰好是原中序的反转');
    // 翻转后具体结构断言：根 3 的左右孩子已互换
    assert.strictEqual(root.left, n1);
    assert.strictEqual(root.right, n5);
    assert.strictEqual(n1.left, n8, '节点 1 翻转后 8 成为其左孩子');
    assert.strictEqual(n2.left, n4, '节点 2 翻转后左孩子为 4');
    assert.strictEqual(n2.right, n7);
    console.log(`翻转前中序 [${before.join(', ')}]`);
    console.log(`翻转后中序 [${after.join(', ')}]（恰好反转），左右孩子结构断言通过`);

    // 翻转空树不报错
    assert.strictEqual(invertTree(null), null);
    console.log('i3 断言全部通过。');
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
