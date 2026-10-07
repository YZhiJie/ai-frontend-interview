# 六、全栈开发（Next.js）

> 本领域考察以 Next.js 为核心的全栈落地能力：为不同业务选择正确的渲染与缓存策略、组织清晰的服务端/客户端边界、并在生产环境完成部署与可观测性闭环。在 AI 应用普遍需要服务端代理与流式输出的背景下，能否把 Next.js 用成"真正的全栈框架"是中高级前端工程师的分水岭。

**题量分布**：Basic 3 题 · Intermediate 3 题 · Advanced 3 题（共 9 题）

**🎬 配套漫画**：[EP.06 SSR/SSG/ISR 选型](../comics/ep06-nextjs-rendering.svg)

---

## 🟢 Basic（基础）

### FS-B1｜Next.js 核心特性与两种路由范式

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请概述 Next.js 的核心特性：文件系统路由的工作方式、支持的多种预渲染方式、内置的性能优化能力（图片/字体/脚本），并系统对比 App Router 与 Pages Router 的区别。
- **考察要点**：
  - 文件系统路由的目录约定（动态路由、嵌套布局）
  - SSR / SSG / ISR / CSR 四种渲染方式的时机差异
  - next/image、next/font、next/script 各自优化的具体问题
  - App Router 与 Pages Router 在心智模型上的本质区别
- **参考答案要点**：
  - 文件系统路由：pages/ 或 app/ 目录结构即路由，无需手动配置；动态路由用 `[id]`、`[...slug]` 约定，App Router 中目录嵌套天然对应嵌套布局。
  - 预渲染方式：SSR 每次请求渲染、SSG 构建时生成静态 HTML、ISR 静态 + 按 revalidate 周期再生、CSR 完全客户端渲染；App Router 默认倾向服务端组件静态化。
  - 图片：next/image 按设备生成合适尺寸的 WebP/AVIF、原生懒加载、预留宽高防布局抖动（CLS）；字体：next/font 构建期自托管并预加载，消除 FOUT 与请求瀑布；脚本：next/script 按 beforeInteractive/afterInteractive/lazyOnload 控制三方脚本加载时机。
  - App Router：app/ 目录、默认 React Server Components、layout.tsx 嵌套复用，新增 Streaming、并行路由、拦截路由与 Server Actions，数据获取直接用 fetch 的缓存语义。
  - Pages Router：pages/ 目录、文件默认导出组件，通过 getServerSideProps/getStaticProps 在组件外取数，布局需手动封装，属于旧范式但仍受支持。
  - 选型判断：新项目默认 App Router；存量 Pages Router 可与 App Router 共存，按路由渐进迁移。

### FS-B2｜React Server Components 与 'use client' 边界

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请解释 React Server Components（RSC）的概念：服务端组件与客户端组件的差异、`'use client'` 指令的真实含义与边界规则、哪些能力在服务端组件中不可用，以及跨边界传递 props 的序列化限制。
- **考察要点**：
  - RSC 的执行模型与客户端 JS 成本优势
  - 'use client' 作为"边界声明"而非"组件类型标注"的准确理解
  - 服务端组件不可用的能力清单（状态、副作用、浏览器 API、事件）
  - 跨边界 props 的可序列化约束与 children 组合模式
- **参考答案要点**：
  - RSC 是一种组件执行模型：服务端组件只在服务器运行并输出渲染结果（RSC Payload），不进入客户端 bundle，可直接访问数据库/文件系统/环境变量，客户端 JS 成本为零。
  - `'use client'` 不是"这个组件是客户端组件"的标注，而是"从这里开始进入客户端边界"的声明：被标记的模块及其全部 import（含第三方包入口）都成为客户端代码。
  - 服务端组件不能使用：useState/useEffect/useReducer 等状态与副作用 Hook、浏览器 API（window/document）、事件处理器（onClick 等）；需要交互的部分要拆成独立的客户端组件。
  - 序列化限制：服务端组件向客户端组件传 props 必须可序列化——不能传函数（Server Actions 除外）、Class 实例、Symbol 等；可以传 JSX 作为 children，把服务端内容"组合"进客户端组件（slot 模式）。
  - 组合推荐：服务端组件做数据获取与静态结构，客户端组件只负责交互态；用 children/props 下传可缩小"客户端化"范围。
  - 心智模型：以 'use client' 文件为根的整个子树都在客户端渲染（首屏仍会 SSR 出 HTML），边界划分直接决定 bundle 体积。

### FS-B3｜实现一个 SSR 页面与一个 SSG 页面

- **题型**：实际场景应用题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  场景约束：站点里有"商品详情页"（价格库存实时性强）与"关于我们"页（内容基本不变）。请分别用 SSR 与 SSG 实现，统一采用 App Router 的 fetch cache 语义（不混用 Pages Router），写出关键代码并说明各自的渲染时机。
  ```tsx
  // app/products/[id]/page.tsx —— SSR：每次请求都重新取数
  interface Product {
    id: string;
    name: string;
    price: number;
  }

  export default async function ProductPage({
    params,
  }: {
    params: Promise<{ id: string }>; // Next 15 起 params 为 Promise（Next 14 直接是对象）
  }) {
    const { id } = await params;
    // cache: 'no-store'：不缓存，等价于 Pages Router 的 getServerSideProps
    const res = await fetch(`https://api.example.com/products/${id}`, {
      cache: 'no-store',
    });
    const product: Product = await res.json();

    return <main>{product.name}：¥{product.price}</main>;
  }
  ```
  ```tsx
  // app/about/page.tsx —— SSG：构建时渲染，之后每次请求直接复用静态 HTML
  export default async function AboutPage() {
    // 默认 cache: 'force-cache'：构建期执行并缓存，等价于 getStaticProps
    const res = await fetch('https://api.example.com/site-info');
    const info = await res.json();

    return <main>{info.description}</main>;
  }
  ```
- **考察要点**：
  - App Router 中 fetch 缓存语义与渲染方式的对应关系
  - SSR 与 SSG 的渲染时机差异及对 TTFB 的影响
  - 两种策略在不同业务页面的选择依据
  - 与 Pages Router 传统 API 的概念映射
- **参考答案要点**：
  - 渲染时机：SSR 在每次请求时于服务端执行并返回最新 HTML（数据实时，TTFB 取决于数据源耗时）；SSG 在构建时预渲染成 HTML，请求命中 CDN/缓存，速度最快但内容到下次构建前不变。
  - App Router 判定：fetch 默认 `cache: 'force-cache'` 走静态/缓存（SSG 语义）；`cache: 'no-store'` 或使用 cookies()/headers() 等动态 API 则每次请求渲染（SSR 语义）。
  - Pages Router 对照：getServerSideProps ≈ no-store，getStaticProps ≈ force-cache，概念一一对应，迁移心智可复用。
  - 选型：商品详情页要实时价格库存选 SSR（或加 ISR 折中）；关于页内容稳定选 SSG，发布时构建一次即可。
  - 注意事项：SSR 页面要控制数据源响应时间（必要时加超时与降级），SSG 页面数据构建后更新需配合 ISR（revalidate）或按需再生（revalidateTag）。
  - 两种策略可按路由粒度混用，Next 会按页面级别自动决定静态或动态渲染。

## 🟡 Intermediate（进阶）

### FS-I1｜渲染策略全面对比与四场景选型

- **题型**：技术选型题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  请系统对比 Pages Router 的 `getServerSideProps`、`getStaticProps`、`getStaticPaths` + fallback（blocking/true）与 ISR（revalidate）的渲染时机、优缺点与适用条件；并给以下四个场景给出选型结论：新闻详情页、实时运营仪表盘、电商商品详情页、产品文档站。
- **考察要点**：
  - 四种策略在数据新鲜度与性能之间的取舍
  - fallback: 'blocking' 与 fallback: true 的体验差异
  - ISR 的 stale-while-revalidate 语义与按需再生
  - 依据数据实时性与路径规模做选型的推理过程
- **参考答案要点**：
  - getServerSideProps：每次请求渲染，数据绝对新鲜、可读 cookie/headers 做个性化；代价是 TTFB 高、无法用 CDN 缓存整页，适合强实时或依赖请求上下文的页面。
  - getStaticProps：构建时生成，性能最好、可 CDN 分发、SEO 友好；但数据在下次构建前固化，动态路由需 getStaticPaths 枚举路径。
  - getStaticPaths + fallback: 'blocking'：未预渲染的路径首次请求时服务端渲染并缓存，用户无闪烁但首访偏慢；fallback: true 先返回 fallback UI 再后台生成（配合 router.isFallback 提示），适合路径海量、无法全部预构建的场景。
  - ISR（revalidate: N）：静态性能 + 准实时内容，到期后第一个请求返回旧内容并触发后台再生（stale-while-revalidate 语义），可配合 on-demand revalidation（revalidate API + tag）精准刷新。
  - 选型结论：新闻详情页 → SSG + ISR（revalidate 60s 或按需再生，突发热点路径靠 fallback 覆盖）；实时运营仪表盘 → SSR（或客户端轮询/WebSocket 补充）；电商商品详情页 → ISR + fallback: 'blocking'（价格库存接受秒级延迟，配合按需再生保证准确性）；文档站 → SSG（内容随版本发布更新，确定性最高）。
  - 选型原则：默认"静态优先"（SSG/ISR），只有数据强实时或依赖请求上下文才用 SSR；用 fallback/ISR 平衡"首访体验"与"构建时长"。

### FS-I2｜Route Handlers 实战与登录态 middleware

- **题型**：实际场景应用题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  场景约束：在 App Router 项目中：① 实现 `middleware.ts` 对 `/dashboard/**` 做登录态校验，无有效会话时重定向到 `/login?from=…`；② 在 `/api/preferences` Route Handler 中实现 Cookie 的读取与写入；③ 说明该 Handler 运行在 Edge Runtime 与 Node.js Runtime 下的特性差异与限制。
  ```ts
  // middleware.ts —— 运行在 Edge Runtime，位于所有请求之前
  import { NextRequest, NextResponse } from 'next/server';

  export function middleware(req: NextRequest) {
    const token = req.cookies.get('session')?.value;
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

    if (isDashboard && !token) {
      // 未登录：重定向到登录页并携带回跳地址
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  export const config = {
    matcher: ['/dashboard/:path*'], // 只在需要的路径执行，减少开销
  };
  ```
  ```ts
  // app/api/preferences/route.ts —— Route Handler 中读写 Cookie
  import { NextRequest, NextResponse } from 'next/server';

  export async function GET(req: NextRequest) {
    const theme = req.cookies.get('theme')?.value ?? 'light'; // 读 Cookie
    return NextResponse.json({ theme });
  }

  export async function POST(req: NextRequest) {
    const { theme } = await req.json();
    const res = NextResponse.json({ ok: true });
    res.cookies.set('theme', theme, {
      // 写 Cookie 并加固
      httpOnly: true,    // 防 JS 读取，降低 XSS 窃取风险
      sameSite: 'lax',   // 缓解 CSRF
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return res;
  }
  ```
- **考察要点**：
  - middleware 的执行时机与 matcher 配置
  - 重定向/改写响应的构造方式
  - Route Handler 中 Cookie 的读写 API 与安全属性
  - Edge Runtime 与 Node.js Runtime 的能力边界
- **参考答案要点**：
  - middleware 在路由匹配前于服务端执行（默认 Edge Runtime），适合鉴权重定向、A/B 改写、安全头注入；用 config.matcher 限定路径，避免每个请求都白跑一遍。
  - 鉴权要点：middleware 里只做"会话是否存在/签名是否有效"这类轻量校验（如验证 JWT），重 IO 的权限查询应下沉到页面或 Handler 内。
  - Cookie 读用 `req.cookies.get()`；写通过 NextResponse 的 `res.cookies.set()`，显式设置 httpOnly/secure/sameSite/maxAge，敏感值务必 httpOnly。
  - Edge Runtime：冷启动极低、全球边缘分发，但只支持 Web API 子集——不能用 Node 内置模块（fs、child_process 等）、部分 npm 包不兼容、无长驻内存与长连接能力。
  - Node.js Runtime（route.ts 中 `export const runtime = 'nodejs'`，也是 Handler 的默认值）：完整 Node API 与生态，适合数据库直连、重依赖库；冷启动与延迟高于 Edge。
  - 选型建议：纯鉴权/轻改写放 middleware（Edge），涉及数据库或重依赖的 API 用 Node Runtime 的 Route Handler。

### FS-I3｜Next.js 状态管理方案设计

- **题型**：架构设计题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  为一个中大型 Next.js 应用设计状态管理方案：要求区分服务端状态与客户端状态；服务端数据（列表、详情）用 SWR / TanStack Query 做缓存与重验证；UI 全局状态用 Zustand 或 Context；明确各状态的存放位置与"服务端组件 / 客户端组件"的代码组织边界。
- **考察要点**：
  - 服务端状态与客户端状态的划分标准
  - TanStack Query/SWR 的缓存、重验证与 SSR 预取配合
  - Zustand 与 Context 各自的适用规模与重渲染影响
  - 'use client' 边界下沉与状态目录的组织方式
- **参考答案要点**：
  - 核心原则：先问"数据从哪来、谁关心它"——来自 HTTP 且需要缓存/重验证的是服务端状态，交给 TanStack Query/SWR；纯 UI 交互态（弹窗、主题、多步表单草稿）才是客户端状态。
  - 服务端状态：在客户端组件中封装 hooks（如 `useProducts()`），统一管理缓存 key、staleTime、自动 revalidate 与乐观更新；SSR 阶段用预取（dehydrate/hydrate 或 fallbackData）避免首屏请求瀑布。
  - RSC 优先：能用服务端组件直接 fetch 的页面数据不进客户端 store，避免"把服务器数据全量复制进 Redux"的反模式；Query 主要服务于强交互的客户端视图（搜索、分页、实时刷新）。
  - 客户端状态：跨页面共享的少量全局态用 Zustand（按 slice 拆 store，selector 订阅避免无关重渲染）；仅组件树局部共享用 Context，注意 value 变更会重渲染整个消费子树，勿传放大对象。
  - 边界组织：'use client' 只下沉到叶子交互组件；服务端组件负责取数与布局，把 hooks 消费者作为 children 传入；stores/ 与 hooks/queries/ 独立目录存放，不与页面耦合。
  - 反模式清单：把服务端数据同步进 Zustand、在服务端组件里用 Context/hooks、为了用状态管理把整棵树标 'use client'。

## 🔴 Advanced（高级）

### FS-A1｜大型 Next.js 应用架构设计

- **题型**：架构设计题
- **难度**：Advanced ★★★★★
- **问题描述**：
  请为一个多业务线的中大型 Next.js（App Router）应用设计前端架构：路由分组与多层 Layout 的组织；并行路由（Parallel Routes）与拦截路由（Intercepting Routes）的适用场景；代码分割与加载策略（dynamic import / loading 约定）；bundle 分析与包体优化；图片/字体/第三方脚本的系统性优化。
- **考察要点**：
  - 路由分组与 layout/template 层级的设计能力
  - 并行路由与拦截路由各自解决的问题域
  - 代码分割策略与流式加载体验的结合
  - bundle 预算治理与资源加载优化
- **参考答案要点**：
  - 路由组织：用 (marketing)、(admin) 等路由分组隔离互不影响 URL 的布局体系；根 layout 放全局壳（Provider、字体、监控），业务 layout 承载导航与鉴权；需要"切路由保留状态"的场景用 template.tsx 而非 layout.tsx。
  - 并行路由：`@modal` 与 children 同层独立渲染，适合仪表盘多面板、模态与页面并存且各自独立加载/独立报错；拦截路由 `(.)photo` 让"列表页点开详情"以模态呈现、同时支持直链直达完整页面，配合并行路由实现。
  - 代码分割：路由级分割由框架自动完成；重组件（图表、富文本编辑器）用 next/dynamic 或 React.lazy + Suspense 按需加载，配 loading.tsx / Suspense 骨架做流式渐进展示，避免整页阻塞。
  - 包体治理：@next/bundle-analyzer 定位大依赖；按需引入（lodash-es 具名导入、moment 换 dayjs）、审计 barrel file 的副作用导入、拆分大依赖；给 first load JS 设预算并纳入 CI 门禁。
  - 资源优化：next/image 用 sizes/priority 控制首屏 LCP；next/font 构建期自托管字体并做 subset；next/script 按 strategy 区分关键与非关键三方脚本（分析类 lazyOnload、支付类 afterInteractive）。
  - 配套机制：按层级配置 error.tsx / not-found.tsx / loading.tsx，保证局部故障与加载状态不拖垮整页。

### FS-A2｜Next.js 与 AI 服务集成的全栈方案

- **题型**：架构设计题
- **难度**：Advanced ★★★★★
- **问题描述**：
  场景约束：为产品内置一个对话式 AI 助手：① 浏览器不得接触 LLM API Key，必须经 Next.js Route Handler 代理；② 回答要求逐字流式输出；③ 前端用 Vercel AI SDK 渲染流式消息，并与 React Suspense / 流式渲染结合；④ 长任务需要超时控制与重试。请给出整体方案与关键代码（Route Handler 代理 + SSE 透传 + 客户端流式渲染）。
  ```ts
  // app/api/chat/route.ts —— LLM 代理 + SSE 流式透传
  import { streamText } from 'ai';
  import { openai } from '@ai-sdk/openai';

  export const maxDuration = 60; // 平台级函数超时上限（秒）

  export async function POST(req: Request) {
    const { messages } = await req.json();

    // API Key 只存在于服务端环境变量，浏览器不可见
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      onError: ({ error }) => {
        // 记录日志，客户端收到的是友好错误提示
        console.error(error);
      },
    });

    // 转为 SSE 响应直接透传，不要 await 全量结果
    return result.toTextStreamResponse();
  }
  ```
  ```tsx
  // components/ChatPanel.tsx —— 客户端流式渲染
  'use client';
  import { useChat } from '@ai-sdk/react';

  export function ChatPanel() {
    const { messages, input, handleInputChange, handleSubmit, status, error } = useChat();

    return (
      <div>
        {messages.map((m) => (
          <p key={m.id}>
            {m.role}: {m.content}
          </p>
        ))}
        {/* status 驱动"生成中"状态与输入禁用 */}
        <form onSubmit={handleSubmit}>
          <input value={input} onChange={handleInputChange} disabled={status !== 'ready'} />
        </form>
        {error && <p>生成失败，请重试</p>}
      </div>
    );
  }
  ```
- **考察要点**：
  - API Key 的服务端代理边界与鉴权限流设计
  - SSE 流式协议与 toTextStreamResponse 透传机制
  - useChat/streaming UI 与 Suspense 流式渲染的结合
  - 长任务的超时、重试与降级策略
- **参考答案要点**：
  - 代理边界：Route Handler 是唯一持有 Key 的层（服务端环境变量），统一做用户鉴权、按用户/IP 限流、内容审计与用量日志，浏览器只与自家 API 通信。
  - 流式链路：上游 LLM 的 SSE 在 Handler 中转为 stream，`result.toTextStreamResponse()` 直接透传；切勿在 Handler 里 await 全量结果，否则流式失去意义、TTFB 恶化。
  - streaming UI：Vercel AI SDK 的 useChat/useCompletion 自动消费 SSE 并增量更新消息状态，status 管理生成中/完成/错误态；更进一步的 streamUI 可让模型直接产出 React 组件，按节点流式上屏并与 Suspense 边界配合。
  - 流式渲染结合：页面级用服务端组件 + Suspense 包裹 AI 区块，先出骨架后到内容，改善 TTFB 与感知性能。
  - 超时与重试：maxDuration 设置函数上限；对上游请求加 AbortSignal.timeout，幂等请求用指数退避重试；非幂等长任务转队列（如 BullMQ）+ 轮询或 SSE 查询进度。
  - 健壮性：SSE 断线重连与消息去重、用户主动取消（AbortController）、敏感词过滤与 token 用量统计，避免账单失控。

### FS-A3｜Next.js 部署与性能监控方案

- **题型**：架构设计题
- **难度**：Advanced ★★★★☆
- **问题描述**：
  请为一个生产环境 Next.js 应用设计部署与可观测性方案：Vercel 与自托管 Docker 的取舍；ISR/缓存策略在生产环境的正确配置；Web Vitals 采集上报（useReportWebVitals）；OpenTelemetry / Sentry 的接入；灰度发布与回滚机制。
- **考察要点**：
  - 托管平台与自托管在能力、成本、合规上的取舍
  - 缓存分层与 ISR 按需再生的生产配置
  - Web Vitals 指标采集、聚合与告警
  - 全链路追踪、错误监控与发布回滚机制
- **参考答案要点**：
  - Vercel vs 自托管：Vercel 零配置获得 ISR/Edge/图片优化与 Preview 环境，按用量计费、深度绑定平台；自托管（Docker + K8s/云主机）可控性强、成本可优化、满足私有化与合规要求，但要自行实现 CDN、图片优化、扩缩容与构建流水线。
  - 缓存配置：分层设置——静态资源 immutable + 长 max-age、HTML/ISR 页面走 s-maxage + stale-while-revalidate；ISR 用 revalidate 周期 + on-demand revalidation（revalidatePath/revalidateTag）挂到 CMS 发布钩子精准失效；自托管需自建缓存层并确认 ISR 持久化位置。
  - Web Vitals：useReportWebVitals 在客户端组件中上报 CLS/LCP/FCP/INP/TTFB 到自建打点或分析服务，按路由分组聚合，对 P75 设预算告警（如 LCP > 2.5s 触发通知）。
  - OpenTelemetry：通过 instrumentation.ts 注册 SDK，自动追踪请求/渲染/数据获取 span，导出 OTLP 到 Jaeger/Tempo 等后端，串联 Route Handler 与上游服务做全链路分析。
  - Sentry：@sentry/nextjs 同时覆盖客户端、服务端与 Edge 运行时，配置 source map 上传还原堆栈、采样率与用户信息脱敏，用 release 标记把错误定位到具体版本。
  - 灰度与回滚：Vercel 用 Preview 链接与分流策略、instant rollback 秒级回退；自托管用不可变镜像 tag + 蓝绿/金丝雀（K8s 按权重切流），健康检查失败自动回滚上一版本；发布前以 smoke 测试与 Web Vitals 对比作为质量门禁。

---

## 📌 本领域高频考点速记

- 渲染选型"静态优先"：SSG/ISR 打底，数据强实时或依赖请求上下文才上 SSR。
- App Router 中 fetch 的 cache 语义决定静态/动态；cookies()/headers() 等动态 API 会触发动态渲染。
- 'use client' 是边界声明：该文件及其 import 的整棵子树进客户端 bundle；跨界 props 必须可序列化（不能传函数，Server Actions 除外）。
- fallback: 'blocking' 首访即完整渲染、fallback: true 先出骨架；海量动态路径必配 getStaticPaths + fallback。
- middleware 跑在 Edge 做轻量鉴权与改写；重依赖与数据库访问放 Node Runtime 的 Route Handler。
- 状态二分：服务端数据归 TanStack Query/SWR，UI 态归 Zustand/Context；RSC 能取的数据别复制进客户端 store。
- 并行路由（@modal）做仪表盘多面板；拦截路由（(.)xxx）做"列表页模态详情、可分享直链"。
- AI 集成三件套：Route Handler 代理藏 Key、SSE 流式透传、useChat/streaming UI 流式渲染。
- 包体治理：@next/bundle-analyzer 定位 + dynamic import 切割 + first load JS 预算进 CI 门禁。
- 缓存失效用 on-demand revalidation（revalidateTag/Path）挂 CMS 钩子；可观测性 = useReportWebVitals + Sentry + OpenTelemetry。
