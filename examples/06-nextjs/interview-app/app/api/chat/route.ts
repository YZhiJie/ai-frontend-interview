// FS-A2：SSE mock LLM —— 不依赖任何外部 API Key / 网络
// 真实项目中此处调用 LLM（Key 只存在服务端环境变量），并用流透传；
// 本演示用 ReadableStream + TextEncoder 逐块吐出中文 SSE 帧。
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MOCK_REPLY =
  '你好！我是完全运行在本地的模拟助手，无需任何 API Key 或外网请求，这段回答正通过 SSE 逐块流式输出。';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
  const encoder = new TextEncoder();
  // 按 2 个字切一帧，约 30 帧
  const chunks = MOCK_REPLY.match(/.{1,2}/g) ?? [];

  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const chunk of chunks) {
          if (closed) break;
          // SSE 协议：data: <负载>\n\n
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`),
          );
          await delay(30);
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
    cancel() {
      // 前端 AbortController.abort() 会触发这里
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
