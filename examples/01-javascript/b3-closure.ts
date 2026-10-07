/**
 * 对应题号：JS-B3｜闭包的定义、形成原理与经典应用
 * 运行命令：npx tsx 01-javascript/b3-closure.ts
 *
 * 演示两个工程中最经典的闭包应用：
 * 1. 私有变量计数器（模块模式）：外部无法直接访问内部状态，只能通过暴露的方法读写
 * 2. 防抖 debounce：定时器 id 保存在外层作用域，多次触发共享同一份状态
 */

// ============ 应用一：闭包实现私有变量 ============
function createCounter(name: string) {
    // count 是 createCounter 执行上下文中的局部变量，外部无法直接访问
    let count = 0;

    // 返回的三个方法都闭包引用了同一个 count（与外层 AO），使其不会被 GC
    return {
        getName: () => name,
        inc: () => ++count,
        dec: () => --count,
        getCount: () => count,
    };
}

const counter = createCounter('购物车数量');
console.log('===== 私有变量计数器（闭包） =====');
console.log('初始值:', counter.getCount()); // 0
console.log('inc() =>', counter.inc()); // 1
console.log('inc() =>', counter.inc()); // 2
console.log('dec() =>', counter.dec()); // 1
console.log('当前值:', counter.getCount(), '| 名称:', counter.getName());
// 外部无法直接拿到 count：它不是对象属性，只存在于闭包的词法环境中
console.log('(counter as Record<string, unknown>).count =', (counter as unknown as Record<string, unknown>).count); // undefined

// 两个计数器各自持有独立的闭包变量，互不干扰
const other = createCounter('通知数量');
other.inc();
console.log('另一个计数器 =', other.getCount(), '，原计数器仍为 =', counter.getCount()); // 1, 1

// ============ 应用二：防抖 debounce ============
/**
 * 防抖：连续触发时，每次都重新计时；只有「停止触发 wait 毫秒后」才真正执行一次。
 * 利用闭包在多次调用之间共享 timer 变量；同时保存 this 与参数。
 */
function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
    let timer: ReturnType<typeof setTimeout> | null = null; // 闭包私有状态：定时器 id

    const debounced = (...args: A): void => {
        if (timer !== null) clearTimeout(timer); // 已有定时器则取消，重新计时
        timer = setTimeout(() => {
            timer = null;
            fn(...args); // 最后一次触发的参数会被传入
        }, wait);
    };

    // 额外暴露一个取消防抖的方法（同样靠闭包访问 timer）
    debounced.cancel = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    };
    return debounced;
}

// 用伪造时钟模拟连续调用，避免真实等待 1 秒，输出仍然直观
function simulateDebounce(): void {
    console.log('\n===== 防抖 debounce：模拟在 350ms 内连续输入 5 次（wait=100ms） =====');
    const fired: string[] = [];
    const search = debounce((keyword: string) => {
        fired.push(keyword);
        console.log(`[t=${virtualNow}ms] 真正发起搜索，关键词 = "${keyword}"`);
    }, 100);

    let virtualNow = 0;
    const originals = { setTimeout, clearTimeout };
    // 简易虚拟时钟：收集定时器，按虚拟时间推进触发
    type Timer = { at: number; cb: () => void };
    const timers: Timer[] = [];
    // 边界处用 as any：此处必须替换全局定时器实现以模拟时间流逝
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).setTimeout = (cb: () => void, ms: number) => {
        const id = timers.length + 1;
        timers.push({ at: virtualNow + ms, cb });
        return id as unknown as ReturnType<typeof setTimeout>;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).clearTimeout = (id: ReturnType<typeof setTimeout>) => {
        const idx = timers.findIndex((_, i) => i + 1 === (id as unknown as number));
        if (idx >= 0) timers.splice(idx, 1);
    };

    // 时间轴：0/50/100/150/200ms 各输入一次，之后推进到 350ms
    const inputs: Array<[number, string]> = [
        [0, 'a'],
        [50, 'ab'],
        [100, 'abc'],
        [150, 'abcd'],
        [200, 'abcde'],
    ];
    for (const [at, kw] of inputs) {
        virtualNow = at;
        console.log(`[t=${at}ms] 用户输入 "${kw}"，调用 debounced`);
        search(kw);
    }
    virtualNow = 350;
    // 触发所有到期定时器（防抖场景下只剩最后一个）
    [...timers].filter((t) => t.at <= virtualNow).forEach((t) => t.cb());

    // 还原真实定时器
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).setTimeout = originals.setTimeout;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).clearTimeout = originals.clearTimeout;

    console.log(`最终搜索只执行了 ${fired.length} 次，关键词为 "${fired[0]}"（前 4 次被定时器重置吞掉）`);
}
simulateDebounce();

console.log('\n闭包原理小结：');
console.log('- 闭包 = 函数 + 其定义时词法环境的引用；内部函数让外层 AO「可达」而不被 GC；');
console.log('- 私有变量利用「状态持久化 + 外部不可直接访问」，防抖利用「多次调用间共享同一份 timer/参数状态」；');
console.log('- 代价：被引用的变量生命周期被延长，意外持有大对象或 DOM 引用会造成内存泄漏。');
