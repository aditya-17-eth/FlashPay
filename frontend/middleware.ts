import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// A robust MVP rate limiter would use Redis. 
// For now, we simulate simple allowance in edge (no persistence across instances)
const ipMap = new Map<string, { count: number; time: number }>();

export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  const pathname = req.nextUrl.pathname;
  const isDashboardApi =
    pathname.startsWith("/api/metrics") || pathname.startsWith("/api/transactions");

  if (isDashboardApi) {
    return response;
  }

  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const now = Date.now();
  const windowMs = 60000;

  const record = ipMap.get(ip) || { count: 0, time: now };
  if (now - record.time > windowMs) {
    record.count = 0;
    record.time = now;
  }

  // Determine limit based on path
  const isAssistant = req.nextUrl.pathname.startsWith("/api/assistant");
  const limit = isAssistant ? 30 : 20;

  if (record.count >= limit) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: 60 },
      { status: 429 }
    );
  }

  record.count++;
  ipMap.set(ip, record);

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
