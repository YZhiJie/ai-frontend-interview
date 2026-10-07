/**
 * C1 复现：SSE 跨 chunk 分帧 / 多字节截断 / [DONE] 终止 / delta 消息模型
 * 运行命令：npx tsx 04-ai-review-dojo/repro/c1-repro.ts
 *
 * 策略：用「你好」两个中文（各占 3 字节）构造 SSE 流，穷举全部单字节切点，
 * 再随机多点分包。修复版必须在任何分包方式下输出唯一结果「你好」；
 * 雷版会在多个切点静默丢帧——帧被切碎后 JSON.parse 失败、被空 catch 吞掉，
 * 切点落在汉字中间时整帧连带消失，错误完全不可观测。
 */

import assert from "node:assert";
import {
  buildSseBytes,
  consumeStreamBuggy,
} from "../challenges/c1-buggy-sse-chat";
import { consumeStreamFixed } from "../solutions/c1-fixed-stream";

export function run(): void {
  console.log("DOJO-C1 SSE 流式解析：雷版 vs 修复版");

  const bytes = buildSseBytes(["你", "好"], { tailAfterDone: true });

  // —— 场景 1：整包一次到达 ——
  const buggyWhole = consumeStreamBuggy([bytes]);
  assert.deepStrictEqual(
    buggyWhole,
    ["你", "好", "[DONE] 之后的泄漏帧"],
    "雷版：delta 各自成消息，且 [DONE] 之后的帧仍被解析",
  );
  const fixedWhole = consumeStreamFixed([bytes]);
  assert.deepStrictEqual(
    fixedWhole,
    ["你好"],
    "修复版：delta 累加为一条消息，[DONE] 终止全流",
  );
  console.log("  · 整包到达：雷版 3 条碎片（含泄漏帧），修复版 1 条「你好」");

  // —— 场景 2：穷举全部单字节切点（含从汉字中间切开） ——
  let brokenCuts = 0;
  for (let cut = 1; cut < bytes.length; cut++) {
    const parts = [bytes.subarray(0, cut), bytes.subarray(cut)];

    const fixedOut = consumeStreamFixed(parts);
    assert.deepStrictEqual(
      fixedOut,
      ["你好"],
      `修复版在字节切点 ${cut} 必须保持不变`,
    );

    const buggyOut = consumeStreamBuggy(parts);
    const joined = buggyOut.join("");
    if (!joined.includes("你") || !joined.includes("好")) brokenCuts += 1;
  }
  assert.ok(brokenCuts > 0, "雷版：应至少在一个分包切点静默丢帧");
  console.log(
    `  · 穷举 ${bytes.length - 1} 个字节切点：修复版恒为「你好」；` +
      `雷版在 ${brokenCuts} 个切点静默丢帧（含切断多字节汉字）`,
  );

  // —— 场景 3：随机多点分包（模拟真实 TCP 1~4 字节碎片） ——
  for (let seed = 1; seed <= 50; seed++) {
    const parts: Uint8Array[] = [];
    let prev = 0;
    let x = (seed * 2654435761) % 2 ** 31;
    while (prev < bytes.length) {
      x = (x * 1103515245 + 12345) % 2 ** 31;
      const step = 1 + (x % 4); // 1~4 字节一片
      parts.push(bytes.subarray(prev, Math.min(prev + step, bytes.length)));
      prev += step;
    }
    assert.deepStrictEqual(
      consumeStreamFixed(parts),
      ["你好"],
      `修复版在多点随机分包 seed=${seed} 下必须正确`,
    );
  }
  console.log("  · 50 组 1~4 字节随机碎片：修复版全部正确");

  console.log("C1 断言全部通过。");
}

import { fileURLToPath } from "node:url";
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
