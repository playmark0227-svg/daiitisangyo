import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roleHome } from "@/lib/session";
import type { Role, User } from "@/lib/types";

export const runtime = "nodejs";

/** デモ用ログイン切替: /api/login?as=<userId> でそのユーザーとしてログイン */
export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("as"));
  const user = db()
    .prepare("SELECT * FROM users WHERE id = ? AND active = 1")
    .get(id) as unknown as User | undefined;
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=notfound", req.url));
  }
  const res = NextResponse.redirect(new URL(roleHome(user.role as Role), req.url));
  res.cookies.set("demo_session", String(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.delete("cart"); // 別ユーザーへのカート引き継ぎを防ぐ
  return res;
}
