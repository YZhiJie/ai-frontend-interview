/**
 * C1 修复版：AI-I4 流式消费的正确写法
 * 运行命令：npx tsx 04-ai-review-dojo/repro/c1-repro.ts
 *
 * 四条修复与雷点一一对应：
 * 1) decoder.decode(chunk, { stream: true })：不完整的多字节字符留在解码器内部缓冲；
 * 2) 维护字符串缓冲区 buf，按事件分隔符 \n\n 切帧，尾部不完整片段留到下个 chunk；
 * 3) 收到 [DONE] 终止「整个」读取过程（finished 标志同时挂起外层 while）；
 * 4) 所有 delta 累加到同一条 current，流结束时产生一条 assistant 消息（打字机模型）。
 */

/** 消费 SSE 字节块序列，返回完整的 assistant 消息列表（一次流 = 一条消息） */
export function consumeStreamFixed(chunks: Uint8Array[]): string[] {
    const decoder = new TextDecoder();
    const turns: string[] = [];
    let buf = '';
    let current = '';
    let finished = false;

    const handleEvent = (rawEvent: string): void => {
        // SSE 规范：一个事件可含多行 data:，按换行拼接；每行至多去掉一个前导空格
        const dataLines: string[] = [];
        for (const line of rawEvent.split('\n')) {
            if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).replace(/^ /, ''));
            }
        }
        if (dataLines.length === 0) return; // 心跳、注释、空事件：忽略
        const payload = dataLines.join('\n');
        if (payload === '[DONE]') {
            finished = true;
            return;
        }
        try {
            const delta = (JSON.parse(payload) as { content?: string }).content ?? '';
            current += delta; // 增量追加到当前消息，而不是新建消息
        } catch {
            // 非 JSON 负载（心跳/服务端注释）跳过，不影响整条流
        }
    };

    for (const chunk of chunks) {
        if (finished) break;
        buf += decoder.decode(chunk, { stream: true });
        let sep = buf.indexOf('\n\n');
        while (sep >= 0) {
            const rawEvent = buf.slice(0, sep);
            buf = buf.slice(sep + 2);
            handleEvent(rawEvent);
            if (finished) break;
            sep = buf.indexOf('\n\n');
        }
    }

    if (current !== '') turns.push(current);
    return turns;
}
