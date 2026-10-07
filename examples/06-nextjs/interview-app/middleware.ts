// FS-I2：登录态 middleware（默认运行在 Edge Runtime，路由匹配前执行）
// 只做轻量校验：cookie 中是否存在 token；真正的权限查询应下沉到页面 / Route Handler。
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // 无会话：重定向登录页，并带上原路径用于登录后回跳
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// matcher：只拦截受保护路径，避免每个请求都白跑一遍
export const config = {
  matcher: ['/dashboard/:path*'],
};
