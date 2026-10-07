// 动态 Route Handler：每次请求实时返回服务器时间与进程号
// 供 state-demo 页用 SWR 每秒轮询，演示「服务端状态」
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    now: new Date().toISOString(),
    pid: process.pid,
  });
}
