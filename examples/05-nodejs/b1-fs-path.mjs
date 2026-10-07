/**
 * NODE-B1｜fs 三板斧 + path 防坑（零依赖，直接运行：node b1-fs-path.mjs）
 *
 * 演示内容：
 *   1. path.join / path.resolve / path.extname 的语义差异（打印）
 *   2. 生成约 20MB 临时文件（Buffer 一次写入），分别用：
 *      - readFileSync + writeFileSync 一次性复制（活动内存随文件大小线性增长）
 *      - createReadStream + pipeline 流式复制（活动内存恒定，约等于 chunk 大小）
 *      对比 process.memoryUsage() 的 rss / heapUsed / external 三个指标
 *   3. 结束自动清理临时文件
 *
 * 测量说明（重要，建议用 --expose-gc 运行：node --expose-gc b1-fs-path.mjs）：
 *   - Buffer 的内存在 V8 堆外，计入 external，不计入 heapUsed；
 *   - rss 是 OS 视角常驻内存，malloc/free 的页在 macOS 上通常不立刻归还 OS，
 *     所以 rss 只增不减、无法区分「正在使用」与「曾经分配」；
 *   - GC 后仍被引用的 external 增量，才是大文件读取真实的内存代价。
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pipeline } from "node:stream/promises";

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";
const tick = () => new Promise((resolve) => setImmediate(resolve));

// 采样前做两轮 GC；ArrayBuffer 堆外内存靠 GC 后的 weak callback 回收，
// 需要让出一次事件循环（setImmediate）external 数字才回落，所以这里是 async
async function snap(label, base) {
  if (global.gc) {
    await tick();
    global.gc();
    await tick();
    global.gc();
    await tick();
  }
  const m = process.memoryUsage();
  const suffix = base
    ? `（Δrss ${mb(m.rss - base.rss)}, Δheap ${mb(m.heapUsed - base.heapUsed)}, Δexternal ${mb(m.external - base.external)}）`
    : "";
  console.log(
    `${label.padEnd(20)} rss=${mb(m.rss).padStart(9)}  heapUsed=${mb(m.heapUsed).padStart(7)}  external=${mb(m.external).padStart(8)} ${suffix}`,
  );
  return m;
}

/* ---------- 第一部分：path 三个常用 API ---------- */

console.log("========== path API 语义 ==========");
console.log("当前工作目录 cwd =", process.cwd());
console.log();

// join：拼接并规范化路径（处理重复斜杠、.. 等），结果可以是相对路径
console.log(
  "path.join('a', 'b', '../c', 'd.txt') =",
  path.join("a", "b", "../c", "d.txt"),
);
// resolve：从右向左拼，直到拼出绝对路径；相对段以 process.cwd() 为基准
console.log(
  "path.resolve('a', 'b', 'c.txt')       =",
  path.resolve("a", "b", "c.txt"),
);
console.log(
  "path.resolve('/etc', 'b', 'c.txt')    =",
  path.resolve("/etc", "b", "c.txt"),
); // 遇到绝对段停止向左
// extname：取扩展名（含点），常用来决定如何解析文件
console.log(
  "path.extname('photo.tar.gz')         =",
  path.extname("photo.tar.gz"),
); // 只取最后一段
console.log();

// 反例：为什么不要用 './a' + '/' + fileName
const userInput = "../../../etc/passwd"; // 恶意/失误输入
const dangerous = "./upload/" + userInput;
const safe = path.normalize(path.join("./upload", userInput));
console.log("手动拼接（有路径穿越风险）:", dangerous);
console.log(
  "join + normalize 后      :",
  safe,
  "→ 还需再校验结果是否仍在目标目录内",
);
console.log();

if (!global.gc) {
  console.log(
    "⚠ 当前未启用 --expose-gc，无法强制回收，内存数字会混入尚未回收的垃圾；",
  );
  console.log("  想看干净对比请运行：node --expose-gc b1-fs-path.mjs");
  console.log();
}

/* ---------- 第二部分：20MB 文件的两种复制方式内存对比 ---------- */

const SIZE_MB = 20;
const tmpDir = os.tmpdir();
const src = path.join(tmpDir, `node-b1-src-${process.pid}.bin`);
const dstSync = path.join(tmpDir, `node-b1-dst-sync-${process.pid}.bin`);
const dstStream = path.join(tmpDir, `node-b1-dst-stream-${process.pid}.bin`);

async function main() {
  console.log(`========== 准备 ${SIZE_MB}MB 临时文件 ==========`);
  console.log("源文件:", src);
  // Buffer 一次性写入测试数据（20MB）
  const chunk = Buffer.alloc(SIZE_MB * 1024 * 1024, 0x61); // 0x61 = 'a'
  await fsp.writeFile(src, chunk);
  console.log("文件已生成，实际大小 =", mb((await fsp.stat(src)).size));
  console.log();

  /* ---- 方式 A：readFileSync 一次性读入内存（活动内存峰值） ---- */
  console.log(
    "---------- A. readFileSync 全量读取（数据读取期间一直被引用） ----------",
  );
  const baseA = await snap("A 读取前基线");
  let data = fs.readFileSync(src); // 20MB 整体进内存，且同步阻塞事件循环
  await snap("A readFileSync 后", baseA); // ← 此刻 data 还活着：external +约20MB
  console.log("  ↑ 数据活着时 external 增量 ≈ 文件大小；2GB 文件这里就会 OOM");
  fs.writeFileSync(dstSync, data); // 再整体写出
  data = null; // 解除引用，GC + weak callback 后这 20MB 堆外内存即被回收
  await snap("A 释放引用并 GC 后", baseA);
  console.log();

  /* ---- 方式 B：createReadStream 流式复制（活动内存恒定） ---- */
  console.log(
    "---------- B. createReadStream + pipeline（任何时刻只有 64KB 级 chunk 存活） ----------",
  );
  const baseB = await snap("B 流式前基线");
  await pipeline(
    fs.createReadStream(src), // 默认 highWaterMark 64KB，按 chunk 读
    fs.createWriteStream(dstStream),
  ); // pipeline 内置背压（写不动就暂停读）与错误传播，resolve 即写完
  await snap("B 流式复制完成", baseB); // ← external 增量接近 0：chunk 用完即被回收
  console.log(
    "  ↑ external/heapUsed 几乎无增量：文件放大到 2GB，活动内存仍是这个量级",
  );
  console.log(
    "  （若 rss 仍上涨：那是 OS 层 malloc 页未归还，不代表程序还持有这些内存）",
  );
  console.log();

  console.log("========== 结论 ==========");
  console.log(
    "小文件/启动期配置：readFile / readFileSync（同步版绝不能放进请求处理路径）；",
  );
  console.log(
    "大文件（上传解析、导出、转发）：createReadStream + pipeline，背压自动处理、内存恒定。",
  );
  console.log();

  /* ---------- 验证复制结果一致并清理 ---------- */
  const okSync = (await fsp.readFile(dstSync)).length === SIZE_MB * 1024 * 1024;
  const okStream =
    (await fsp.readFile(dstStream)).length === SIZE_MB * 1024 * 1024;
  console.log("复制正确性：sync =", okSync, "，stream =", okStream);

  for (const f of [src, dstSync, dstStream]) {
    await fsp.rm(f, { force: true });
  }
  console.log("临时文件已清理。");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
