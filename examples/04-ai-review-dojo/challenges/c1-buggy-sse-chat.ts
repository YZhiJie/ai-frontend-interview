/**
 * 对应题号：AI-I4｜代码审查：AI 生成的流式聊天组件 —— C1 雷源码
 * 运行命令：npx tsx 04-ai-review-dojo/repro/c1-repro.ts
 *
 * 本文件把 PR 中 React 组件的「流式消费逻辑」抽成框架无关的纯函数，便于在 Node 复现。
 * 故意保留 4 处缺陷（分级见 answers/c1-answers.md），修复版见 solutions/c1-fixed-stream.ts。
 * 注意：不要在真实项目里复制本文件的任何写法。
 */

/** 测试夹具：把若干 delta 与 [DONE] 编码成标准 SSE 字节流 */
export function buildSseBytes(
    deltas: string[],
    options: { tailAfterDone?: boolean } = {},
): Uint8Array {
    const frames = deltas.map((d) => `data: ${JSON.stringify({ content: d })}\n\n`);
    frames.push('data: [DONE]\n\n');
    // 可选：[DONE] 之后再塞一帧（服务端异常/代理行为），检验客户端是否真正终止
    if (options.tailAfterDone) {
        frames.push('data: {"content":"[DONE] 之后的泄漏帧"}\n\n');
    }
    return new TextEncoder().encode(frames.join(''));
}

/**
 * 雷版消费（原样摘自 AI 生成的 PR）：
 * 逐 chunk decode、逐 chunk split，每个 data 帧 push 一条「新」assistant 消息。
 */
export function consumeStreamBuggy(chunks: Uint8Array[]): string[] {
    const messages: string[] = [];
    const decoder = new TextDecoder();
    for (const chunk of chunks) {
        const text = decoder.decode(chunk); // 雷 1：未传 { stream: true }，多字节字符被切断即乱码
        for (const event of text.split('\n\n')) {
            // 雷 2：不维护跨 chunk 缓冲区，一个事件被网络分包切半就丢帧/错帧
            for (const line of event.split('\n')) {
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (payload === '[DONE]') break; // 雷 3：只跳出内层 for，外层事件循环继续
                try {
                    messages.push((JSON.parse(payload) as { content: string }).content);
                    // 雷 4：每个 delta 都 push 成新气泡，而非追加到同一条 assistant 消息
                } catch {
                    // 非 JSON 帧被静默吞掉（错误路径不可观测）
                }
            }
        }
    }
    return messages;
}
