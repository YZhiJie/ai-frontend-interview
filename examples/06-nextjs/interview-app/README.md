# interview-app · Next.js 15 全栈面试演示工程

App Router + TypeScript，**纯 mock 数据，无任何真实密钥 / 外部服务 / 外网字体图片**。
覆盖题库《六、全栈开发（Next.js）》FS-B1/B2/B3、FS-I1/I2/I3、FS-A1/A2/A3 的核心考点。

## 运行步骤

```bash
# Node >= 18.18（开发环境为 Node v24 / pnpm 11）
pnpm install
pnpm dev        # 默认 http://localhost:3000
# 指定端口：npx next dev -p 3410

pnpm build      # 生产构建（已开启 output: 'standalone'）
pnpm start      # 本地以生产模式运行
```

## 页面 → 题号映射表

| 路由 | 渲染/能力 | 对应题号 | 看什么 |
| --- | --- | --- | --- |
| `/` | **SSG**：async Server Component 直接 await mock（fetch force-cache 语义） | FS-B1、FS-B3、FS-I1 | 角标「构建时生成 SSG」+ 构建时间，刷新不变 |
| `/products` | SSG 列表入口 | FS-I1 | 链接到 4 个商品 |
| `/products/[id]` | **ISR**：`generateStaticParams` 预生成 1/2 + `revalidate=10` + 未预生成 id 按需再生 | FS-B3、FS-I1 | 角标「ISR revalidate=10」+ 渲染时间；/products/3 首访按需渲染 |
| `/dashboard` | **SSR**：`cookies()` 触发强制动态渲染 | FS-B3、FS-I1、FS-I2 | 角标「SSR 每次请求渲染」+ 每秒变化的服务端时间 |
| `/docs/[[...slug]]` | **SSG 动态路由**：`generateStaticParams` 3 篇文档 | FS-B1、FS-I1 | 纯静态，构建时枚举全部路径 |
| `middleware.ts` | Edge middleware 保护 `/dashboard`，无 token 307 跳 `/login?from=...` | FS-I2 | `curl -sI` 可看 Location |
| `/login` | 登录表单 → Route Handler 写 **httpOnly** cookie；一键演示登录；登出 | FS-I2 | 任意用户名 + 密码 `123456` |
| `/api/time` | 动态 Route Handler，返回 `{now, pid}` | FS-I2、FS-I3 | SWR 每秒轮询的数据源 |
| `/api/chat` | **SSE mock LLM**：`ReadableStream` 逐块 `data: {"delta"}\n\n` + `[DONE]` | FS-A2 | `curl -N` 看多帧输出 |
| `/ai` | 客户端 `getReader` 手写 SSE 解析 + 打字机 + `AbortController` 停止 | FS-A2 | 浏览器体验流式输出与中断 |
| `/state-demo` | **zustand**（计数器/待办，客户端态）+ **SWR**（轮询服务端态） | FS-I3 | 页面文字说明两类状态边界 |
| `components/web-vitals.ts` | `useReportWebVitals` 上报占位（console.log） | FS-A3 | layout 中引入，打开 DevTools Console |
| `next.config.mjs` | `output: 'standalone'` | FS-A3 | 构建产出可 Docker 化的独立服务 |
| 全局 | Server/Client 组件边界、系统字体栈（禁用 `next/font/google`）、CSS/SVG 占位 | FS-B2、FS-A1 | 用到 state/事件/SWR 的文件均在首行 `'use client'` |

> FS-A1（大型应用架构）的路由分组 / 并行与拦截路由 / loading.tsx 等为组织约定，
> 本工程以「渲染策略全景 + 边界正确」为最小可运行切片；落地要点见题库正文。

## curl 验证命令（假设端口 3410）

```bash
# SSG 首页（200）
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3410/

# 商品：列表 / 预生成详情 / 未预生成 id 按需渲染
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3410/products
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3410/products/1
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3410/products/3

# 文档 SSG
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3410/docs/getting-started

# SSR 鉴权：无 cookie 307 跳 /login；带 cookie 200
curl -sI http://127.0.0.1:3410/dashboard | grep -iE 'HTTP/|location'
curl -s -o /dev/null -w '%{http_code}\n' -b 'token=demo' http://127.0.0.1:3410/dashboard

# 动态 API
curl -s http://127.0.0.1:3410/api/time
curl -N --max-time 5 http://127.0.0.1:3410/api/chat

# 登录写 cookie（保存到 cookie jar 后再访问 dashboard）
curl -s -c jar.txt -X POST http://127.0.0.1:3410/api/auth \
  -H 'Content-Type: application/json' -d '{"username":"alice","password":"123456"}'
curl -s -b jar.txt -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3410/dashboard
```

## 部署要点（FS-A3）

- `pnpm build` 产出 `.next/standalone/`（含最小化 `server.js`），配合
  `.next/static` 即可打入精简镜像，**build once, deploy many**：

  ```dockerfile
  FROM node:22-alpine AS deps
  WORKDIR /app
  COPY package.json pnpm-lock.yaml ./
  RUN corepack enable && pnpm install --frozen-lockfile
  COPY . .
  RUN pnpm build

  FROM node:22-alpine
  WORKDIR /app
  ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
  COPY --from=deps /app/.next/standalone ./
  COPY --from=deps /app/.next/static ./.next/static
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```

- **缓存**：带哈希的 `/_next/static/*` 设 `immutable` 长缓存；HTML/ISR 页走
  `s-maxage` + stale-while-revalidate；ISR 可用 `revalidatePath/revalidateTag`
  挂 CMS 发布钩子按需失效。
- **可观测性**：[components/web-vitals.ts](components/web-vitals.ts) 用
  `useReportWebVitals` 上报 LCP/CLS/INP/FCP/TTFB（占位 console.log，生产换
  RUM 接口）；服务端可在 `instrumentation.ts` 接 OpenTelemetry，错误监控接
  Sentry 并按 release 标记。
- **灰度/回滚**：镜像用不可变 tag，K8s 蓝绿/金丝雀切流，健康检查失败自动回滚；
  发布前 smoke 测试 + Web Vitals 对比作为门禁。
