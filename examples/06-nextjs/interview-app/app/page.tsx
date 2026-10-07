// FS-B3 / FS-I1 之 SSG：首页文章列表
// async Server Component 直接 await 本地 mock 函数（等价 fetch(..., {cache:'force-cache'})）
// 页面在 `next build` 时预渲染为静态 HTML，之后所有请求直接复用。
import Link from 'next/link';
import { getPosts } from '@/lib/mock-data';

// 模块级常量：静态页面构建时求值一次，用来证明「内容固化在构建产物里」
const BUILD_TIME = new Date().toISOString();

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <div>
      <h1>
        <span className="badge green">构建时生成 SSG</span>
        首页 · 文章列表
      </h1>
      <p className="muted">
        本页为 Server Component，构建时取数一次并固化。生成时间（构建期）：
        <code>{BUILD_TIME}</code>
        ，刷新页面该时间不会变化（dev 模式每次编译会重置，属正常）。
      </p>

      {posts.map((post) => (
        <article key={post.id} className="card">
          <h3 style={{ margin: '0 0 6px' }}>{post.title}</h3>
          <p style={{ margin: '0 0 8px' }}>{post.excerpt}</p>
          <span className="muted">
            {post.author} · {post.createdAt}
          </span>
        </article>
      ))}

      <p className="muted" style={{ marginTop: 24 }}>
        继续体验：<Link href="/products">商品列表（ISR）</Link> ·{' '}
        <Link href="/docs/getting-started">产品文档（SSG 动态路由）</Link> ·{' '}
        <Link href="/dashboard">实时仪表盘（SSR，需登录）</Link>
      </p>
    </div>
  );
}
