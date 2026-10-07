// FS-I2：登录态 Route Handler —— 写 / 清 httpOnly Cookie
// 演示规则：任意用户名 + 固定密码 123456；或一键演示登录
import { NextResponse } from 'next/server';

const COOKIE_OPTS = {
  httpOnly: true, // 防 JS 读取，降低 XSS 窃取风险
  sameSite: 'lax' as const, // 缓解 CSRF
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
    demo?: boolean;
  };

  if (!body.demo && body.password !== '123456') {
    return NextResponse.json(
      { ok: false, error: '密码错误，演示密码为 123456' },
      { status: 401 },
    );
  }

  const token = body.demo ? 'demo' : `user:${body.username ?? 'guest'}`;
  const res = NextResponse.json({ ok: true, token });
  res.cookies.set('token', token, COOKIE_OPTS);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('token', '', { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
