'use client';

// FS-I3：两类状态的边界演示
// - 客户端 UI 状态（计数器 / 待办）→ zustand，存在浏览器内存
// - 服务端状态（服务器时间）→ SWR 管理缓存 + 轮询重验证，数据来自 HTTP，
//   绝不复制进 zustand（避免「把服务器数据同步进全局 store」的反模式）
import { useState } from 'react';
import useSWR from 'swr';
import { useAppStore } from '@/lib/store';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StateDemoPage() {
  // ---- 客户端状态：zustand（selector 订阅，避免无关重渲染） ----
  const count = useAppStore((s) => s.count);
  const inc = useAppStore((s) => s.inc);
  const dec = useAppStore((s) => s.dec);
  const resetCount = useAppStore((s) => s.resetCount);
  const todos = useAppStore((s) => s.todos);
  const addTodo = useAppStore((s) => s.addTodo);
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const removeTodo = useAppStore((s) => s.removeTodo);

  const [todoText, setTodoText] = useState('');

  // ---- 服务端状态：SWR（缓存 key、自动重验证、1s 轮询） ----
  const { data, isLoading } = useSWR<{ now: string; pid: number }>(
    '/api/time',
    fetcher,
    { refreshInterval: 1000 },
  );

  return (
    <div>
      <h1>
        <span className="badge">FS-I3</span>
        状态管理：zustand（客户端态） + SWR（服务端态）
      </h1>

      <div className="card" style={{ borderColor: 'var(--accent)' }}>
        <h3 style={{ marginTop: 0 }}>🖥️ 服务端状态 → SWR 轮询 /api/time</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          数据来自 HTTP，缓存 key、自动重验证、轮询都由 SWR 负责；它不属于任何全局
          store。刷新间隔 1000ms。
        </p>
        <p style={{ fontSize: 18 }}>
          服务器时间：
          <code>{isLoading || !data ? '加载中…' : data.now}</code>
        </p>
        <p className="muted">pid：{data?.pid ?? '-'}</p>
      </div>

      <div className="card" style={{ borderColor: 'var(--accent-2)' }}>
        <h3 style={{ marginTop: 0 }}>🧩 客户端 UI 状态 → zustand</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          纯交互态，存在浏览器内存，刷新即重置；跨组件共享，selector 精确订阅。
        </p>

        <p>
          计数器：<strong style={{ fontSize: 20 }}>{count}</strong>{' '}
          <button onClick={inc}>+1</button>
          <button className="secondary" onClick={dec}>
            -1
          </button>
          <button className="secondary" onClick={resetCount}>
            重置
          </button>
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (todoText.trim()) {
              addTodo(todoText.trim());
              setTodoText('');
            }
          }}
        >
          <input
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
            placeholder="新增待办…"
            aria-label="新增待办"
          />
          <button type="submit">添加</button>
        </form>

        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {todos.map((t) => (
            <li key={t.id} style={{ padding: '4px 0' }}>
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTodo(t.id)}
                  style={{ marginRight: 8 }}
                />
                <span
                  style={{
                    textDecoration: t.done ? 'line-through' : 'none',
                    color: t.done ? 'var(--muted)' : 'var(--text)',
                  }}
                >
                  {t.text}
                </span>
              </label>
              <button
                className="danger"
                style={{ padding: '2px 10px', marginLeft: 8 }}
                onClick={() => removeTodo(t.id)}
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="muted">
        边界原则：能用 Server Component 直接取的数据不进客户端 store；HTTP
        数据归 SWR/TanStack Query；只有纯 UI 交互态才归 zustand/Context。
      </p>
    </div>
  );
}
