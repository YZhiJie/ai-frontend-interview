# EP.06 SSR/SSG/ISR 选型

> 对应正文：[docs/06-fullstack-nextjs.md](../docs/06-fullstack-nextjs.md)（覆盖 FS-B3 SSR/SSG 页面实现 / FS-I1 四场景渲染选型 / FS-I2 middleware 与 Route Handler / FS-A2 AI 流式代理）· 配套示例：`../examples/06-nextjs/interview-app/app/products/[id]/page.tsx`、`../examples/06-nextjs/interview-app/middleware.ts`、`../examples/06-nextjs/interview-app/app/api/chat/route.ts`

## 剧情回顾

- **第 1 格**：小研吐槽两难——纯 SSR 首屏要等接口，纯 SSG 页面上的价格又总是过时。码叔说：静态与动态不是单选题，`getStaticProps`、`getServerSideProps` 之外还有 `revalidate: 60` 的 ISR。
- **第 2 格**：码叔摆出三栏对比：SSR 每请求渲染、内容最新但 TTFB 高；SSG 构建时预生成、速度最快但更新要重新构建；ISR 用静态打底、过期后增量再生，是快与新的折中。
- **第 3 格**：小研给出选型矩阵：新闻首页 SSG+ISR、用户仪表盘 SSR、商品详情页 ISR、帮助文档 SSG——先问数据新鲜度，再问页面数量。
- **第 4 格**：结案两个高频坑：`getServerSideProps` 每请求都跑、重逻辑会拖大 TTFB；`revalidate` 是过期触发而不是定时器，要等下一个请求上门才再生。

## 知识点拆解

### 第 1 格 · 三个取数函数，三种时机

- `getStaticProps`：构建时生成 HTML（SSG），之后请求直接命中 CDN/缓存；
- `getServerSideProps`：每次请求都在服务端渲染（SSR），数据绝对新鲜、可读 cookie 做个性化；
- `revalidate: 60`：ISR，静态性能打底，页面过期后由请求触发后台再生；
- App Router 的等价映射（FS-B3）：`fetch` 默认 `force-cache` ≈ `getStaticProps`，`cache: 'no-store'` 或使用 `cookies()/headers()` ≈ `getServerSideProps`，迁移心智可直接复用。

### 第 2 格 · 三栏对比

- **SSR**：每请求都渲染，内容永远最新；代价是首屏要等服务端取数、并发高时服务器压力大，整页也无法走 CDN 缓存；
- **SSG**：构建时预生成，访问速度最快、SEO 友好；只适合偏静态内容，数据更新要重新构建，动态路径需配合 `getStaticPaths` 枚举；
- **ISR**：SSG 的壳、到期自动换新数据——过期后第一个请求先拿到旧内容，后台触发再生（stale-while-revalidate 语义），还可配 on-demand revalidation（revalidateTag）精准刷新。

### 第 3 格 · 四类页面四张答案

商品详情页价格库存实时性强又海量，正是 ISR 的典型场景，示例工程里的商品页用 SSR 语义写成：

```tsx
// app/products/[id]/page.tsx
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>; // Next 15 起 params 为 Promise
}) {
  const { id } = await params;
  // cache: 'no-store' 不缓存，等价 getServerSideProps；
  // 允许秒级延迟时改成 next: { revalidate: 60 } 即变 ISR
  const res = await fetch(`https://api.example.com/products/${id}`, {
    cache: 'no-store',
  });
  const product = await res.json();
  return <main>{product.name}：¥{product.price}</main>;
}
```

- 新闻首页 → **SSG + ISR**，新内容定时再生，突发热点路径靠 `fallback` 覆盖；
- 用户仪表盘 → **SSR**，个性化数据实时出（鉴权可前置到 `middleware.ts`，只做轻量会话校验）；
- 商品详情页 → **ISR + fallback: 'blocking'**，量大且允许秒级延迟，配按需再生保准确；
- 帮助文档 → **SSG**，内容随版本发布更新，速度拉满。

### 第 4 格 · 静态优先，动态补刀

- 码叔结论与 docs 一致：能用静态就尽量静态（SSG/ISR 打底），只有数据强实时或依赖请求上下文才用 SSR；
- 静态页面上的动态数据交给客户端 SWR / TanStack Query 补充，避免把整页拖回服务端渲染；
- AI 流式接口这类必须藏 Key 的动态能力，则放到 Route Handler（FS-A2，见 `app/api/chat/route.ts`），与页面渲染策略互不干扰。

## 坑点清单

1. **`getServerSideProps` 每请求都跑**：重逻辑、慢接口慎放，TTFB 会随并发越来越大；数据源要加超时与降级；
2. **`revalidate` 是过期触发，不是定时器**：页面到期后要等下一个请求上门才后台再生，该请求先拿到旧内容，没人访问就不会刷新；
3. **海量动态路径只靠 SSG 会构建到天荒地老**：配 `getStaticPaths + fallback: 'blocking'`，未预渲染路径首访时服务端渲染并缓存。

## 自测 3 题（含答案）

1. ISR 页面过期后由谁触发再生？——**过期后第一个请求先返回旧内容并在后台触发再生（stale-while-revalidate），不是定时器主动刷新**。
2. 商品详情页选哪种渲染策略？——**ISR + fallback: 'blocking'：页面数量大、访问要快，且价格库存允许秒级延迟，再配按需再生保证准确**。
3. App Router 里怎么表达"每次请求渲染"？——**fetch 加 `cache: 'no-store'`，或使用 cookies()/headers() 等动态 API，等价于 getServerSideProps**。
