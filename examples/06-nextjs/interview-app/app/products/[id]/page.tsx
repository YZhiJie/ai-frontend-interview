// FS-B3 / FS-I1 之 ISR：商品详情
// - generateStaticParams 预生成前 2 个商品
// - revalidate = 10：10 秒内复用缓存，到期后首个请求返回旧内容并触发后台再生
//   （stale-while-revalidate）
// - dynamicParams 默认 true：未预生成的 id（3、4）首次请求按需渲染后纳入缓存
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductById, products } from '@/lib/mock-data';

export const revalidate = 10;

export function generateStaticParams() {
  // 只预生成前 2 个商品，模拟「路径海量无法全部预构建」
  return products.slice(0, 2).map((p) => ({ id: p.id }));
}

// 未在 generateStaticParams 中列出的路径也允许按需渲染（App Router 默认即 true）
export const dynamicParams = true;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>; // Next 15 起 params 是 Promise
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  // 每次（重新）渲染时的服务端时间：同一 revalidate 窗口内保持不变，到期再生后变化
  const renderedAt = new Date().toISOString();

  return (
    <div>
      <h1>
        <span className="badge">ISR revalidate=10</span>
        {product.name}
      </h1>
      <p className="muted">
        本次渲染时间（服务端）：<code>{renderedAt}</code>
        ，10 秒内刷新保持不变；超过 10 秒后第一次刷新触发后台再生，再刷新可见时间变化。
      </p>

      <div className="card">
        <p>商品编号：{product.id}</p>
        <p>价格：¥{product.price}</p>
        <p>
          库存：
          <span style={{ color: product.stock === 0 ? 'var(--danger)' : undefined }}>
            {product.stock === 0 ? '暂时缺货' : `${product.stock} 件`}
          </span>
        </p>
        <p>{product.desc}</p>
      </div>

      <p>
        <Link href="/products">← 返回商品列表</Link>
      </p>
    </div>
  );
}
