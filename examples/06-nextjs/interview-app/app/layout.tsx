import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { WebVitalsReporter } from '@/components/web-vitals';

export const metadata: Metadata = {
  title: 'AI 前端面试题库 · Next.js 15 全栈演示',
  description:
    'SSG / ISR / SSR、middleware、Route Handler、SSE AI、zustand + SWR 的可运行示例',
};

const navItems = [
  { href: '/', label: '首页(SSG)' },
  { href: '/products', label: '商品(ISR)' },
  { href: '/docs/getting-started', label: '文档(SSG)' },
  { href: '/dashboard', label: '仪表盘(SSR)' },
  { href: '/ai', label: 'AI(SSE)' },
  { href: '/state-demo', label: '状态(zustand+SWR)' },
  { href: '/login', label: '登录' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <nav className="nav">
          <span className="brand">🎯 Next.js 面试演示</span>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="container">{children}</main>
        <WebVitalsReporter />
      </body>
    </html>
  );
}
