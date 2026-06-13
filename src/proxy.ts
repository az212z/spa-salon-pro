import { NextRequest, NextResponse } from "next/server";

// نطاقات فرعية محجوزة للمنصة نفسها — ليست صالونات
const RESERVED = new Set(["www", "app", "admin", "api"]);

// كل صالون على نطاقه الفرعي: demo.localhost:3000 → ‎/s/demo
export default function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000").toLowerCase();

  if (host === root || !host.endsWith(`.${root}`)) return NextResponse.next();

  const sub = host.slice(0, -(root.length + 1));
  if (!sub || sub.includes(".") || RESERVED.has(sub)) return NextResponse.next();

  const url = req.nextUrl.clone();
  if (url.pathname.startsWith("/s/")) return NextResponse.next();
  url.pathname = `/s/${sub}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
