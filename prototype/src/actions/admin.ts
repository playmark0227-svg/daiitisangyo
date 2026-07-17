"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import {
  approveCancelAndRefund,
  notifyRole,
  saveCategory,
  setProductPublic,
  setSetting,
  setUserActive,
  updateProduct,
} from "@/lib/domain";
import type { Badge } from "@/lib/types";

/** 商品の公開/非公開切り替え（管理者） */
export async function adminSetProductPublic(formData: FormData): Promise<void> {
  await requireUser("admin");
  const id = Number(formData.get("id"));
  const next = String(formData.get("next")) === "1";
  if (!Number.isFinite(id)) redirect("/admin/products?error=notfound");
  setProductPublic(id, next);
  redirect("/admin/products");
}

/** 商品情報の変更（カテゴリ・バッジ・公開状態・締切時刻） */
export async function adminUpdateProduct(formData: FormData): Promise<void> {
  await requireUser("admin");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) redirect("/admin/products?error=notfound");
  const categoryId = Number(formData.get("category_id"));
  const badges = formData.getAll("badges").map(String) as Badge[];
  const isPublic = String(formData.get("is_public")) === "1";
  const deadline = String(formData.get("deadline_time") ?? "").trim();
  if (!/^\d{2}:\d{2}$/.test(deadline)) {
    redirect(`/admin/products/${id}?error=deadline`);
  }
  updateProduct(id, {
    category_id: categoryId,
    badges,
    is_public: isPublic,
    deadline_time: deadline,
  });
  redirect(`/admin/products/${id}?done=1`);
}

/** カテゴリの追加・変更 */
export async function adminSaveCategory(formData: FormData): Promise<void> {
  await requireUser("admin");
  const idRaw = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sort = Number(formData.get("sort") ?? 0);
  if (!name) redirect("/admin/categories?error=name");
  saveCategory(name, Number.isFinite(sort) ? sort : 0, idRaw ? Number(idRaw) : undefined);
  redirect("/admin/categories?done=1");
}

/** キャンセル承認 or 強制返金（返金デモ＋在庫戻し） */
export async function adminApproveRefund(formData: FormData): Promise<void> {
  await requireUser("admin");
  const orderId = Number(formData.get("orderId"));
  if (!Number.isFinite(orderId)) redirect("/admin/orders?error=notfound");
  approveCancelAndRefund(orderId);
  redirect(`/admin/orders/${orderId}?refunded=1`);
}

/** ユーザーの利用停止/再開 */
export async function adminSetUserActive(formData: FormData): Promise<void> {
  const me = await requireUser("admin");
  const id = Number(formData.get("id"));
  const next = String(formData.get("next")) === "1";
  if (!Number.isFinite(id)) redirect("/admin/users?error=notfound");
  if (id === me.id) redirect("/admin/users?error=self");
  setUserActive(id, next);
  redirect("/admin/users");
}

/** 手数料率とデフォルト締切時刻の保存 */
export async function adminSaveMargin(formData: FormData): Promise<void> {
  await requireUser("admin");
  const rate = Number(formData.get("margin_rate"));
  const deadline = String(formData.get("default_deadline") ?? "").trim();
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    redirect("/admin/margin?error=rate");
  }
  if (!/^\d{2}:\d{2}$/.test(deadline)) {
    redirect("/admin/margin?error=deadline");
  }
  setSetting("margin_rate", String(rate));
  setSetting("default_deadline", deadline);
  redirect("/admin/margin?done=1");
}

/** お知らせ配信（アプリ内通知のデモ配信） */
export async function adminSendNotice(formData: FormData): Promise<void> {
  await requireUser("admin");
  const target = String(formData.get("target") ?? "all");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) redirect("/admin/notices?error=empty");
  if (target === "buyer" || target === "all") {
    notifyRole("buyer", "notice", message, "");
  }
  if (target === "seller" || target === "all") {
    notifyRole("seller", "notice", message, "");
  }
  redirect("/admin/notices?sent=1");
}
