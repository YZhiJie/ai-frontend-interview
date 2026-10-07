// ============================================================
// mock 数据层：用本地 async 函数模拟「带 fetch 缓存语义」的数据源
// 不访问任何网络 / 数据库，无需真实密钥
// ============================================================

/** 模拟网络 / 数据库延时 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -------------------- 文章（首页 SSG） --------------------

export interface Post {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  createdAt: string;
}

export const posts: Post[] = [
  {
    id: 1,
    title: 'Next.js 15 App Router 渲染模式速览',
    excerpt: 'SSG / ISR / SSR / CSR 四种时机一图读懂，静态优先是默认心智。',
    author: '面试题库',
    createdAt: '2026-09-20',
  },
  {
    id: 2,
    title: "React Server Components 的 'use client' 边界",
    excerpt: '边界声明而非组件标注：被标记模块及其 import 子树全部进入客户端 bundle。',
    author: '面试题库',
    createdAt: '2026-09-25',
  },
  {
    id: 3,
    title: 'SSE 流式输出：AI 应用的全栈链路',
    excerpt: 'Route Handler 代理藏 Key，ReadableStream 逐块透传，前端 getReader 手解析。',
    author: '面试题库',
    createdAt: '2026-10-01',
  },
];

/**
 * 模拟 fetch(..., { cache: 'force-cache' })：
 * Server Component 直接 await —— 静态页面在构建时执行一次并固化。
 */
export async function getPosts(): Promise<Post[]> {
  await delay(150);
  return posts;
}

// -------------------- 商品（ISR + 按需再生） --------------------

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  desc: string;
}

export const products: Product[] = [
  { id: '1', name: '机械键盘（87 键）', price: 399, stock: 42, desc: '热插拔轴体 · 三模连接' },
  { id: '2', name: '4K 显示器 27 寸', price: 1899, stock: 8, desc: 'IPS · Type-C 90W' },
  { id: '3', name: '人体工学椅', price: 1299, stock: 15, desc: '腰托可调 · 网布坐垫' },
  { id: '4', name: '降噪耳机', price: 899, stock: 0, desc: '自适应降噪 · 40h 续航' },
];

export async function getProducts(): Promise<Product[]> {
  await delay(120);
  return products;
}

/**
 * 模拟商品详情数据源。
 * 配合页面的 export const revalidate = 10：
 * - id=1/2 在 build 时预生成（generateStaticParams）
 * - id=3/4 首次请求按需渲染并缓存，之后 10 秒内复用、到期后台再生
 */
export async function getProductById(id: string): Promise<Product | null> {
  await delay(180);
  return products.find((p) => p.id === id) ?? null;
}

// -------------------- 文档（纯 SSG 动态路由） --------------------

export interface Doc {
  slug: string;
  title: string;
  content: string;
}

export const docs: Doc[] = [
  {
    slug: 'getting-started',
    title: '快速开始',
    content: '安装依赖：pnpm install；启动开发：pnpm dev；生产构建：pnpm build。',
  },
  {
    slug: 'routing',
    title: '文件系统路由',
    content: 'app/ 目录结构即路由：[id] 是动态段，[[...slug]] 是可选 catch-all。',
  },
  {
    slug: 'deployment',
    title: '部署指南',
    content: 'next build 后可部署到 Vercel，或用 output: standalone 产出打入 Docker 自托管。',
  },
];

export async function getAllDocSlugs(): Promise<string[]> {
  await delay(80);
  return docs.map((d) => d.slug);
}

export async function getDocBySlug(slug: string): Promise<Doc | null> {
  await delay(80);
  return docs.find((d) => d.slug === slug) ?? null;
}
