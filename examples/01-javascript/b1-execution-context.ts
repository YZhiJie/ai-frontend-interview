/**
 * 对应题号：JS-B1｜执行上下文的类型与生命周期
 * 运行命令：npx tsx 01-javascript/b1-execution-context.ts
 *
 * 本文件用可观察的打印演示：
 * 1. 函数声明整体提升、var 提升并初始化为 undefined（变量环境）
 * 2. let/const 存在暂时性死区 TDZ（词法环境），声明前访问抛 ReferenceError
 * 3. 每次函数调用创建新的函数执行上下文（独立的局部变量环境），调用结束后出栈
 */

console.log('===== 演示一：创建阶段的提升（hoisting） =====');

// var 在创建阶段被提升并初始化为 undefined，所以声明前访问不报错，值为 undefined
// @ts-expect-error 故意在声明前访问，演示 var 提升为 undefined（运行时不报错）
console.log('1. 声明前读取 var 变量 a =', a); // undefined（不是 ReferenceError）
var a = '我是 var a';
console.log('2. 声明赋值后读取 a =', a);

// 函数声明整体提升：声明语句之前就可以完整调用
console.log('3. 函数声明提升，hoisted() =', hoisted());
function hoisted(): string {
    return '函数声明在创建阶段已完整提升';
}

// let/const 在创建阶段只做「注册」不做初始化，声明执行前处于 TDZ
try {
    // @ts-expect-error 故意在 let 声明前访问，演示 TDZ 抛 ReferenceError
    console.log(b);
    let b = 1;
    void b;
} catch (err) {
    console.log('4. let 声明前访问 TDZ 抛出：', (err as ReferenceError).constructor.name, '—', (err as Error).message);
}

console.log('\n===== 演示二：函数执行上下文的创建 → 执行 → 出栈 =====');

function makeCounter(label: string): () => number {
    // 每次调用 makeCounter 都创建一个全新的函数执行上下文
    // 创建阶段：count（let）在词法环境中注册，进入 TDZ；函数表达式也已就位
    let count = 0; // 执行阶段：逐行执行，count 才被初始化为 0
    console.log(`  [${label}] 函数执行上下文创建并开始执行，count 初始化为`, count);
    return function increment() {
        count += 1;
        return count;
    };
    // return 后该上下文出栈，但 increment 形成闭包，其变量环境仍可达、不会被 GC
}

const counter1 = makeCounter('counter-1');
const counter2 = makeCounter('counter-2');
console.log('counter1() =>', counter1()); // 1
console.log('counter1() =>', counter1()); // 2
console.log('counter2() =>', counter2()); // 1（独立绑定，证明两次调用是两个独立上下文）
console.log('counter1() =>', counter1()); // 3

console.log('\n===== 演示三：var 提升为 undefined 与 let TDZ 在同一函数内的对比 =====');

function lifecycleDemo(): void {
    // 创建阶段已完成：varName 存在于变量环境且值为 undefined；
    // letName 已在词法环境注册但处于 TDZ
    // @ts-expect-error 故意在声明前访问，演示函数内 var 提升为 undefined
    console.log('  执行阶段第一行：varName =', varName); // undefined
    var varName = '赋值后的 varName';
    console.log('  执行阶段赋值后：varName =', varName);

    try {
        // TDZ：letName 虽已「注册」，但声明语句尚未执行
        // @ts-expect-error 故意在声明前访问块级变量，演示 TDZ
        console.log(letName);
        let letName = 'let';
        void letName;
    } catch (err) {
        console.log('  TDZ 捕获：', (err as Error).message);
    }
}
lifecycleDemo();

console.log('\n结论：');
console.log(
    '- 创建阶段：确定 this、构建作用域链；var/函数声明进入变量环境（var 初始化为 undefined），let/const 在词法环境注册但处于 TDZ；',
);
console.log('- 执行阶段：逐行执行，完成变量赋值与函数调用（产生新的函数执行上下文入栈）；');
console.log('- 函数返回后上下文出栈，未被闭包引用的变量环境等待垃圾回收。');
