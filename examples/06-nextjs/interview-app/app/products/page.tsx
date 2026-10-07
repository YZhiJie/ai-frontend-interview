// 商品列表入口：纯静态页面，链接到 ISR 的商品详情
import Link from 'next/link';
import { getProducts } from '@/lib/mock-data';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <h1>
        <span className="badge">ISR</span>
        商品列表
      </h1>
      <p className="muted">
        商品 1 / 2 在构建时预生成；商品 3 / 4 未预生成，首次访问按需渲染（等价 Pages
        Router 的 fallback: 'blocking'），之后按 <code>revalidate = 10</code>{' '}
        秒后台再生。
      </p>

      <div className="grid">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="card">
            <h3 style={{ margin: '0 0 6px' }}>
              #{p.id} {p.name}
            </h3>
            <p style={{ margin: 0 }}>
              ¥{p.price} · 库存 {p.stock}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
