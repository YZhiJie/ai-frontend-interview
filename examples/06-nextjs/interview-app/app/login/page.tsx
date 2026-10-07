'use client';

// FS-I2：登录表单（客户端组件）
// 提交到 Route Handler /api/auth 写入 httpOnly cookie，再跳回 from。
// useSearchParams 需要 Suspense 边界（静态生成要求），见默认导出的包裹。
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';

  const [username, setUsername] = useState('guest');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(body: Record<string, unknown>) {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? '登录失败');
      return;
    }
    router.push(from);
    router.refresh();
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.refresh();
    setError('已登出，cookie 已清除');
  }

  return (
    <div>
      <h1>登录（演示）</h1>
      <div className="card">
        <p className="muted">
          规则：任意用户名 + 固定密码 <code>123456</code>；登录成功后回跳{' '}
          <code>{from}</code>。token 写入 httpOnly cookie，middleware 据此放行
          /dashboard。
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void login({ username, password });
          }}
        >
          <div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名（任意）"
              aria-label="用户名"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码：123456"
              aria-label="密码"
            />
          </div>
          <button type="submit" disabled={loading}>
            登录
          </button>
          <button
            type="button"
            className="secondary"
            disabled={loading}
            onClick={() => void login({ demo: true })}
          >
            一键登录（演示）
          </button>
          <button type="button" className="danger" onClick={() => void logout()}>
            登出（清除 cookie）
          </button>
        </form>

        {error && (
          <p style={{ color: 'var(--warn)', marginBottom: 0 }}>{error}</p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="muted">加载中…</p>}>
      <LoginForm />
    </Suspense>
  );
}
