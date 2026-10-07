// FS-B3 / FS-I1 之 SSR：实时运营仪表盘
// 读取 cookies() 会让本页退出静态化，每次请求都在服务端动态渲染（等价 getServerSideProps）。
// 注意：未登录的真正拦截发生在 middleware.ts（307 重定向到 /login）；
// 这里的无 token 提示属于页面内的防御性文案。
import Link from 'next/link';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  // 每次请求实时求值：刷新页面可见秒数变化
  const now = new Date();

  return (
    <div>
      <h1>
        <span className="badge warn">SSR 每次请求渲染</span>
        实时运营仪表盘
      </h1>

      {!token ? (
        <div className="card">
          <p>当前未检测到登录态（正常情况下你会被 middleware 重定向到登录页）。</p>
          <p>
            <Link href="/login?from=/dashboard">去登录 →</Link>
          </p>
        </div>
      ) : (
        <>
          <p className="muted">
            服务端时间在每次请求时重新生成，刷新浏览器可见每秒变化（无法被 CDN
            整页缓存）：
          </p>
          <div className="card">
            <p style={{ fontSize: 22, margin: '4px 0' }}>
              🕒 {now.toLocaleTimeString('zh-CN', { hour12: false })}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              ISO：{now.toISOString()}
            </p>
          </div>

          <div className="grid">
            <div className="card">
              <h3>今日订单</h3>
              <p style={{ fontSize: 28, margin: 0 }}>1,286</p>
            </div>
            <div className="card">
              <h3>实时在线</h3>
              <p style={{ fontSize: 28, margin: 0 }}>342</p>
            </div>
          </div>

          <p className="muted">当前会话 token（httpOnly Cookie 读出）：{token}</p>
        </>
      )}
    </div>
  );
}
