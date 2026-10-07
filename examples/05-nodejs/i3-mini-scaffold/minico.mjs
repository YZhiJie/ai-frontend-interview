#!/usr/bin/env node
/**
 * NODE-I3｜零依赖迷你脚手架 minico（对标 create-vue 的核心流程子集）
 *
 * 用法：
 *   node minico.mjs <目标目录>
 *   例：node minico.mjs /tmp/minico-demo
 *
 * 交互（管道喂输入也支持，便于 CI/自动化验证）：
 *   printf 'demo-app\nbasic\n' | node minico.mjs /tmp/minico-demo
 *
 * 流程（与 NODE-I3 参考答案对应）：
 *   参数解析 → 目标目录冲突检查 → readline 交互问答（项目名 + 模板二选一）
 *   → 内置模板字符串渲染变量 → 写 package.json 与入口文件 → 打印下一步命令
 * 真实脚手架还会有：命令分发（commander）、远程模板下载（degit）、
 * spawn 安装依赖与 git init、--template/--force 非交互参数。
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

/* ---------- 1. 参数解析 ---------- */

const targetArg = process.argv[2];
if (!targetArg || targetArg === "--help" || targetArg === "-h") {
  console.log("用法: node minico.mjs <目标目录>");
  process.exit(targetArg ? 0 : 1);
}
const targetDir = path.resolve(targetArg);

/* ---------- 2. 目标目录冲突检查（避免误覆盖） ---------- */

if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
  console.error(`✗ 目标目录已存在且非空，已取消创建：${targetDir}`);
  console.error("  （真实脚手架这里会询问是否覆盖；本迷你版为确定性直接拒绝）");
  process.exit(1);
}

/* ---------- 3. 交互问答（TTY 手动输入 / 管道输入均可） ---------- */

// 不能直接用 readline/promises 的 rl.question：管道输入时多行可能在同一个 chunk
// 里被同步解析出多个 'line'，第二个 question 还没注册监听，输入就丢了。
// 这里自建「行队列 + 等待者」：先到的行排队，提问时优先消费队列；EOF 时回落默认值。
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const lineQueue = [];
const waiters = [];
let stdinClosed = false;

rl.on("line", (line) => {
  if (waiters.length > 0) waiters.shift()(line);
  else lineQueue.push(line);
});
rl.on("close", () => {
  stdinClosed = true;
  while (waiters.length > 0) waiters.shift()(undefined); // EOF：未决提问回落默认值
});

function ask(question, defaultValue) {
  process.stdout.write(question);
  return new Promise((resolve) => {
    if (lineQueue.length > 0) return resolve(lineQueue.shift());
    if (stdinClosed) return resolve(undefined);
    waiters.push(resolve);
  }).then((answer) => answer?.trim() || defaultValue);
}

async function askTemplate() {
  for (;;) {
    console.log("可选模板：");
    console.log("  1) basic  —— Hello World（零依赖最小程序）");
    console.log("  2) api    —— node:http 最小 JSON 接口");
    const answer = (
      await ask("请选择模板 [basic/api]（默认 basic）：", "basic")
    ).toLowerCase();
    if (answer === "1" || answer === "basic") return "basic";
    if (answer === "2" || answer === "api") return "api";
    console.log(`「${answer}」不是合法选项，请重新输入。`);
  }
}

const dirDefault = path.basename(targetDir);
const projectName = await ask(
  `项目名称（默认取目录名 ${dirDefault}）：`,
  dirDefault,
);
const template = await askTemplate();
rl.close();

// 包名校验：npm 包名只允许小写字母、数字、-、_
const safeName = projectName.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
console.log();
console.log("配置确认：", { targetDir, projectName: safeName, template });

/* ---------- 4. 两个内置模板（真实脚手架对应远程模板下载 + 变量替换） ---------- */

function renderPackage(name) {
  return (
    JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        type: "module",
        description: `由 minico 脚手架生成（${name}）`,
        scripts: { start: "node index.mjs" },
      },
      null,
      2,
    ) + "\n"
  );
}

const TEMPLATES = {
  basic: (name) => `// ${name} —— 由 minico 的 basic 模板生成
// 运行：node index.mjs

const targets = process.argv.slice(2);
console.log(\`你好，\${targets.length ? targets.join('、') : '${name}'}！\`);
console.log('这是一个零依赖的最小 Node 程序，试着改改我吧。');
`,
  api: (name) => `// ${name} —— 由 minico 的 api 模板生成
// 运行：node index.mjs  然后 curl http://127.0.0.1:3000/
import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ code: 0, data: { app: '${name}', path: req.url, time: new Date().toISOString() } }));
});

server.listen(3000, () => console.log('${name} 已启动：http://127.0.0.1:3000/'));
`,
};

/* ---------- 5. 落盘 ---------- */

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(path.join(targetDir, "package.json"), renderPackage(safeName));
fs.writeFileSync(
  path.join(targetDir, "index.mjs"),
  TEMPLATES[template](safeName),
);

/* ---------- 6. 结果与下一步指引 ---------- */

console.log();
console.log("✓ 项目已生成，文件结构：");
console.log(`  ${path.relative(process.cwd(), targetDir) || "."}/`);
console.log("  ├── package.json");
console.log("  └── index.mjs");
console.log();
console.log("下一步：");
console.log(`  cd ${targetDir}`);
console.log(
  "  node index.mjs" +
    (template === "api"
      ? "   # api 模板：再用 curl http://127.0.0.1:3000/ 验证"
      : ""),
);
