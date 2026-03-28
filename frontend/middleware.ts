import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// A robust MVP rate limiter would use Redis. 
// For now, we simulate simple allowance in edge (no persistence across instances)
const ipMap = new Map<string, { count: number; time: number }>();

export function middleware(req: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/tools/:path*", "/api/assistant"],
};
