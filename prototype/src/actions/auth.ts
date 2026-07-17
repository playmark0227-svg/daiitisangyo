"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { registerByInvite } from "@/lib/domain";
import { clearSession, roleHome, setSession } from "@/lib/session";
import type { Role, User } from "@/lib/types";

/** デモ用: アカウント選択ログイン */
export async function loginAs(formData: FormData): Promise<void> {
  const id = Number(formData.get("userId"));
  const user = db().prepare("SELECT * FROM users WHERE id = ? AND active = 1").get(id) as unknown as
    | User
    | undefined;
  if (!user) redirect("/login?error=notfound");
  await setSession(user.id);
  redirect(roleHome(user.role as Role));
}

/** 招待コードによる新規登録（クローズドβ, F-108/F-205） */
export async function registerWithInvite(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const org = String(formData.get("org") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!code || !name) redirect("/login?error=missing");
  const r = registerByInvite(code, name, org, phone);
  if (!r.ok) redirect(`/login?error=invite`);
  await setSession(r.userId);
  const user = db().prepare("SELECT role FROM users WHERE id = ?").get(r.userId) as unknown as {
    role: Role;
  };
  redirect(roleHome(user.role));
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/login");
}
