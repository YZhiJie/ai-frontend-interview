/**
 * AI 代码审查道场（AI Code Review Dojo）一键自测入口
 * 运行命令：npx tsx 04-ai-review-dojo/run-all.ts
 *
 * C1：SSE 流式解析雷版 vs 修复版（穷举字节切点 + 随机分包）
 * C2：Agent 退款攻击链（越权 + 间接注入 + SQL 注入）vs 纵深防御（审批门 + 幂等）
 * C3：架构 slop PR 夹具完整性门禁（静态审查题）
 * 任一断言失败会立即抛出并以非零码退出。
 */

import { run as runC1 } from './repro/c1-repro';
import { run as runC2 } from './repro/c2-repro';
import { run as runC3 } from './repro/c3-repro';

const suites: Array<{ id: string; title: string; run: () => Promise<void> | void }> = [
    { id: 'DOJO-C1', title: 'AI 流式聊天组件审查（SSE 分帧/多字节/XSS 场景复现）', run: runC1 },
    { id: 'DOJO-C2', title: 'Agent 退款工具安全审查（攻击链 + 纵深防御）', run: runC2 },
    { id: 'DOJO-C3', title: '架构 slop PR 静态审查夹具', run: runC3 },
];

const passed: string[] = [];
for (const suite of suites) {
    console.log(`\n================ ${suite.id}｜${suite.title} ================`);
    await suite.run();
    passed.push(suite.id);
}

console.log('\n========================================================');
console.log(`道场全部用例通过：${passed.length}/${suites.length} 个挑战（${passed.join(', ')}）`);
