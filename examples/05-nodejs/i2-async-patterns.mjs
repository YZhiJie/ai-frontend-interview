/**
 * NODE-I2｜三代异步模式对比 + Promise 并发组合（零依赖）
 * 运行：node i2-async-patterns.mjs
 *
 * 内容：
 *   1. callback 地狱（error-first 回调）→ Promise 链 → async/await
 *   2. Promise.all（fail-fast）/ allSettled（全量结果）/ race（首个落定）
 *   3. “先创建 Promise 再 await”是并发，循环里逐个 await 会退化成串行
 */

const t0 = Date.now();
const log = (msg) => console.log(`+${String(Date.now() - t0).padStart(4, ' ')}ms  ${msg}`);

// 模拟一个随机延迟的异步请求；shouldFail 时在回调/Promise 中走错误通道
function mockFetch(name, delay, shouldFail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      shouldFail
        ? reject(new Error(`${name} 失败`))
        : resolve(`结果(${name})`);
    }, delay);
  });
}

/* ---------------- 1. 三代异步模式 ---------------- */

// 1.1 回调地狱：错误要在每层回调里判断，嵌套随步骤数加深（控制反转：还可能被漏调/重调）
function callbackWay() {
  return new Promise((done) => {
    log('【回调】开始：三层嵌套请求');
    setTimeout(() => {
      log('【回调】第 1 层成功，继续嵌套…');
      setTimeout(() => {
        log('【回调】第 2 层成功，继续嵌套…');
        setTimeout(() => {
          log('【回调】第 3 层成功 —— 再加步骤就要斜着写了（回调地狱）');
          done();
        }, 100);
      }, 100);
    }, 100);
  });
}

// 1.2 Promise 链：错误沿链向下冒泡，一个 catch 收口
function promiseWay() {
  log('【Promise 链】开始');
  return mockFetch('P-1', 120)
    .then((r1) => {
      log('【Promise 链】收到 ' + r1);
      return mockFetch('P-2', 80); // 返回新 Promise，链继续
    })
    .then((r2) => {
      log('【Promise 链】收到 ' + r2);
      return mockFetch('P-3', 60);
    })
    .then((r3) => log('【Promise 链】收到 ' + r3 + '，全部完成'))
    .catch((err) => log('【Promise 链】链上任一失败都在这：' + err.message));
}

// 1.3 async/await：Promise 的语法糖，用 try/catch 恢复同步式书写
async function asyncAwaitWay() {
  log('【async/await】开始');
  try {
    const r1 = await mockFetch('A-1', 100);
    log('【async/await】收到 ' + r1);
    const r2 = await mockFetch('A-2', 70);
    log('【async/await】收到 ' + r2);
    const r3 = await mockFetch('A-3', 50);
    log('【async/await】收到 ' + r3 + '，全部完成');
  } catch (err) {
    log('【async/await】try/catch 捕获：' + err.message);
  }
}

/* ---------------- 2. 三种并发组合 ---------------- */

async function promiseCombos() {
  log('—');
  log('========== Promise 并发组合（三个请求同时发出：100ms 成功 / 50ms 失败 / 150ms 成功）');

  // 关键：Promise 一创建就开始执行，三个在 await 之前已创建 → 并发
  const factories = () => [
    mockFetch('C-1', 100),
    mockFetch('C-2', 50, true),
    mockFetch('C-3', 150),
  ];

  // all：任一失败立即整体 reject（fail-fast）。注意此时其余请求仍在跑完，只是结果被丢弃
  const allStart = Date.now();
  const allResult = await Promise.all(factories()).catch((e) => 'reject: ' + e.message);
  log(`Promise.all       → ${allResult}（约 ${Date.now() - allStart}ms，在 50ms 处快速失败）`);

  // allSettled：等待全部落定，成功失败都保留，顺序与入参数组一致
  const sStart = Date.now();
  const settled = await Promise.allSettled(factories());
  log(
    `Promise.allSettled → ${settled.map((s) => `${s.status}:${s.value || s.reason.message}`).join(' / ')}`,
  );
  log(`                    （等最慢的 150ms 全部落定，实际耗时约 ${Date.now() - sStart}ms，顺序保持 [1,2,3]）`);

  // race：第一个落定者胜出（无论成败），典型用途是超时控制
  const rStart = Date.now();
  const raceResult = await Promise.race([mockFetch('R-慢', 150), mockFetch('R-快', 60)]);
  log(`Promise.race      → ${raceResult}（约 ${Date.now() - rStart}ms，最快者胜出）`);

  const timeout = Promise.race([
    mockFetch('慢请求', 300),
    new Promise((_, reject) => setTimeout(() => reject(new Error('超时 100ms')), 100)),
  ]).catch((e) => 'reject: ' + e.message);
  log(`race 做超时控制    → ${await timeout}`);
}

/* ---------------- 3. 并发 vs 串行 ---------------- */

async function concurrentVsSerial() {
  log('—');
  log('========== 并发 vs 串行（每个请求 100ms）');

  // 并发：先一次性创建，再统一 await → 总耗时 ≈ 最慢的一个
  const cStart = Date.now();
  const results = await Promise.all([mockFetch('并发1', 100), mockFetch('并发2', 100), mockFetch('并发3', 100)]);
  log(`并发（先创建再 await）：${results.length} 个请求，总耗时约 ${Date.now() - cStart}ms`);

  // 串行：循环里逐个 await → 总耗时累加
  const sStart = Date.now();
  for (const name of ['串行1', '串行2', '串行3']) {
    await mockFetch(name, 100);
  }
  log(`串行（循环内逐个 await）：3 个请求，总耗时约 ${Date.now() - sStart}ms`);
}

async function main() {
  await callbackWay();
  log('—');
  await promiseWay();
  log('—');
  await asyncAwaitWay();
  await promiseCombos();
  await concurrentVsSerial();
  log('—');
  log('全部演示结束。');
}

main();
