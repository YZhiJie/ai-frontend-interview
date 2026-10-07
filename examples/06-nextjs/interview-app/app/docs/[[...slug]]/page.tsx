// FS-I1 之纯 SSG 动态路由：产品文档站（可选 catch-all [[...slug]]）
// generateStaticParams 在构建时枚举出 3 篇文档，全部输出为静态 HTML。
import Link from "next/link";
import { notFound } from "next/navigation";
import { docs, getAllDocSlugs, getDocBySlug } from "@/lib/mock-data";

export function generateStaticParams() {
  // 可选 catch-all：slug: [] 对应 /docs 索引页，其余为 3 篇文档
  return [{ slug: [] }, ...docs.map((d) => ({ slug: [d.slug] }))];
}

// 3 篇文档由 generateStaticParams 在构建时静态生成；
// 未枚举的 slug 按需渲染并由 notFound() 返回 404。
// （不设 dynamicParams=false：可选 catch-all 根路径 /docs 在该限制下会被误判 404）

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const slugs = await getAllDocSlugs();

  // /docs：文档索引页
  if (!slug || slug.length === 0) {
    return (
      <div>
        <h1>
          <span className='badge green'>纯静态 SSG</span>
          产品文档
        </h1>
        <ul>
          {slugs.map((s) => (
            <li key={s}>
              <Link href={`/docs/${s}`}>{s}</Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const doc = await getDocBySlug(slug[0]);

  if (!doc) {
    notFound();
  }

  return (
    <div>
      <h1>
        <span className='badge green'>纯静态 SSG</span>
        {doc.title}
      </h1>
      <div className='card'>
        <p style={{ margin: 0 }}>{doc.content}</p>
      </div>
      <p className='muted'>slug：{slug.join("/")}</p>
      <p>
        <Link href='/docs'>← 文档索引</Link>
      </p>
    </div>
  );
}
