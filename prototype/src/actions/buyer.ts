"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addAddress, getProduct, isPastDeadline, listAddresses, placeOrder } from "@/lib/domain";
import { getUser } from "@/lib/session";
import { CART_COOKIE, readCart } from "@/components/buyer/cart-view";
import type { CartLine, User } from "@/lib/types";

/* ---------------- 内部ヘルパー ---------------- */

async function writeCart(lines: CartLine[]): Promise<void> {
  const jar = await cookies();
  jar.set(CART_COOKIE, JSON.stringify(lines), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function requireBuyer(): Promise<User> {
  const user = await getUser();
  if (!user || user.role !== "buyer") redirect("/login");
  return user;
}

/* ---------------- カート操作（cookieベース） ---------------- */

/** カートに追加。商品詳細ページの「カートに入れる」から呼ばれる */
export async function addToCart(formData: FormData): Promise<void> {
  await requireBuyer();
  const productId = Number(formData.get("productId"));
  const qty = Math.max(1, Math.floor(Number(formData.get("qty") ?? 1)) || 1);

  const p = getProduct(productId);
  if (!p || !p.is_public || p.is_template) redirect("/shop");
  if (isPastDeadline(p.deadline_time)) redirect(`/shop/p/${productId}?error=deadline`);
  if (p.stock === 0) redirect(`/shop/p/${productId}?error=soldout`);

  const lines = await readCart();
  const idx = lines.findIndex((l) => l.productId === productId);
  if (idx >= 0) lines[idx] = { productId, qty: Math.min(lines[idx].qty + qty, p.stock) };
  else lines.push({ productId, qty: Math.min(qty, p.stock) });
  await writeCart(lines);
  redirect(`/shop/p/${productId}?added=1`);
}

/** カート内の数量変更 */
export async function updateQty(formData: FormData): Promise<void> {
  await requireBuyer();
  const productId = Number(formData.get("productId"));
  const qty = Math.floor(Number(formData.get("qty")));
  const lines = await readCart();
  const next = lines
    .map((l) => (l.productId === productId ? { ...l, qty } : l))
    .filter((l) => Number.isFinite(l.qty) && l.qty > 0);
  await writeCart(next);
  redirect("/shop/cart");
}

/** カートから1行削除 */
export async function removeLine(formData: FormData): Promise<void> {
  await requireBuyer();
  const productId = Number(formData.get("productId"));
  const lines = await readCart();
  await writeCart(lines.filter((l) => l.productId !== productId));
  redirect("/shop/cart");
}

/** カートを空にする */
export async function clearCart(): Promise<void> {
  await requireBuyer();
  await writeCart([]);
  redirect("/shop/cart");
}

/* ---------------- 注文確定（デモ決済） ---------------- */

/**
 * 注文確定。配送先を確定 → domain.placeOrder（在庫チェック・締切チェック込み）。
 * 成功: カートを空にして /shop/orders/[id]?done=1 へ。
 * 失敗: エラーメッセージを ?error= に載せてチェックアウトへ戻す。
 */
export async function placeOrderAction(formData: FormData): Promise<void> {
  const user = await requireBuyer();
  const lines = await readCart();
  if (lines.length === 0) redirect("/shop/cart");

  const choice = String(formData.get("addressId") ?? "");
  let label = "";
  let address = "";
  if (choice === "" ) {
    redirect(`/shop/checkout?error=${encodeURIComponent("配送先を選択してください。")}`);
  } else if (choice === "new") {
    label = String(formData.get("newLabel") ?? "").trim() || "配送先";
    address = String(formData.get("newAddress") ?? "").trim();
    if (!address) {
      redirect(`/shop/checkout?error=${encodeURIComponent("新しい配送先の住所を入力してください。")}`);
    }
    addAddress(user.id, label, address); // 次回から選べるように保存
  } else {
    const a = listAddresses(user.id).find((x) => x.id === Number(choice));
    if (!a) redirect(`/shop/checkout?error=${encodeURIComponent("配送先を選択してください。")}`);
    label = a.label;
    address = a.address;
  }

  const r = placeOrder(user.id, lines, { label, address });
  if (!r.ok || !r.orderId) {
    redirect(`/shop/checkout?error=${encodeURIComponent(r.error ?? "注文に失敗しました。もう一度お試しください。")}`);
  }
  await writeCart([]);
  redirect(`/shop/orders/${r.orderId}?done=1`);
}

/* ---------------- 配送先（アカウントページ） ---------------- */

/** 配送先の追加 */
export async function addAddressAction(formData: FormData): Promise<void> {
  const user = await requireBuyer();
  const label = String(formData.get("label") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!label || !address) redirect("/shop/account?error=addr");
  addAddress(user.id, label, address);
  redirect("/shop/account?done=addr");
}
