'use client';

// FS-A2：客户端流式 AI 演示
// 不依赖 Vercel AI SDK，手写 fetch + ReadableStream 默认读取器 + SSE 帧解析，
// 打字机渲染；AbortController 实现用户主动停止。
import { useRef, useState } from 'react';

export default function AiPage() {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function start() {
    const controller = new AbortController();
    abortRef.current = controller;
    setText('');
    setDone(false);
    setStreaming(true);

    try {
      const res = await fetch('/api/chat', { signal: controller.signal });
      if (!res.body) throw new Error('响应没有可读取的流');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;

        buffer += decoder.decode(value, { stream: true });
        // SSE 以空行（\n\n）分隔事件
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt
            .split('\n')
            .find((l) => l.startsWith('data:'));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') {
            setDone(true);
            break;
          }
          const json = JSON.parse(payload) as { delta?: string };
          if (json.delta) setText((prev) => prev + json.delta);
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setText((prev) => prev + '\n[已手动停止]');
      } else {
        setText((prev) => prev + `\n[出错] ${(err as Error).message}`);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <div>
      <h1>
        <span className="badge">FS-A2</span>
        AI 助手 · SSE 流式输出（纯本地 mock）
      </h1>
      <p className="muted">
        请求自家 <code>/api/chat</code>（Key 代理边界在服务端），逐帧{' '}
        <code>data: {`{ delta }`}</code> 上屏，收到 <code>[DONE]</code> 结束。
      </p>

      <button onClick={() => void start()} disabled={streaming}>
        {done ? '重新生成' : '开始生成'}
      </button>
      <button className="danger" onClick={stop} disabled={!streaming}>
        停止（AbortController）
      </button>

      <div className="chat-output" style={{ marginTop: 12 }}>
        {text || (
          <span className="muted">
            点击「开始生成」，观察打字机效果；生成中可随时点「停止」中断流。
          </span>
        )}
      </div>
    </div>
  );
}
