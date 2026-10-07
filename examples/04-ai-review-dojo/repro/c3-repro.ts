/**
 * C3 门禁：架构 slop PR 夹具完整性校验
 * 运行命令：npx tsx 04-ai-review-dojo/repro/c3-repro.ts
 *
 * 本题是静态审查题（候选人产物 = 分级意见 + 返工指令），没有可执行修复版，
 * 因此本脚本只保证「考题夹具」本身完整：四类 slop 信号与零测试事实必须在位，
 * 防止后续改动让 challenges/c3-slop-pr.diff 与 answers/c3-answers.md 失配。
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const diffPath = path.join(here, "..", "challenges", "c3-slop-pr.diff");

export function run(): void {
  console.log("DOJO-C3 架构 slop PR：夹具完整性门禁");
  const diff = fs.readFileSync(diffPath, "utf8");

  const markers: Array<[string, string]> = [
    ["引入团队禁用依赖", "@legacy/easy-store"],
    ["无承载抽象层（工厂的工厂）", "AbstractOrderFactoryFactory"],
    ["配套空壳基类", "BaseAbstractOrderService"],
    ["重复造轮子的价格 helper", "formatPriceText"],
    ["被重复的既有 helper", "formatPrice"],
    ["改名复活的废弃促销逻辑", "applyPromotionLegacy"],
    ["仍调用已废弃的 v1 接口", "/api/v1/coupons"],
  ];
  for (const [label, token] of markers) {
    assert.ok(diff.includes(token), `夹具缺失 slop 信号：${label}（${token}）`);
    console.log(`  ✓ ${label}`);
  }

  assert.ok(
    !/\.(test|spec)\.[jt]sx?\b/.test(diff),
    "本 PR 的设定是「零测试」，diff 中不应出现测试文件",
  );
  console.log("  ✓ PR 零测试（符合题设：CI 全绿但无测试）");
  console.log("C3 夹具校验通过（参考答案见 answers/c3-answers.md）。");
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
