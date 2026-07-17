import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role, User } from "./types";

const COOKIE = "demo_session";

export async function getUser(): Promise<User | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isFinite(id)) return null;
  const row = db()
    .prepare("SELECT * FROM users WHERE id = ? AND active = 1")
    .get(id) as unknown as User | undefined;
  return row ?? null;
}

export async function requireUser(role?: Role): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(roleHome(user.role));
  return user;
}

export function roleHome(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/sell";
  return "/shop";
}

export async function setSession(userId: number) {
  const jar = await cookies();
  jar.set(COOKIE, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
