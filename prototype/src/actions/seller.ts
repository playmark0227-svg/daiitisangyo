"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  createProduct,
  generateDescriptionDraft,
  getProduct,
  listCategories,
  markShipped,
  publishFromTemplate,
  requestCancel,
  setProductPublic,
  updateProduct,
} from "@/lib/domain";
import { requireUser } from "@/lib/session";
import type { Badge, TempZone } from "@/lib/types";

const TEMP_VALUES = ["frozen", "chilled", "ambient"];
const BADGE_VALUES = ["NEW", "人気", "朝どれ", "訳あり"];

function num(v: FormDataEntryValue | null, fallback = 0): number {
  // 空文字は Number('') === 0 になり fallback が効かないため明示的に弾く
  const s = String(v ?? "").trim();
  if (s === "") return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function parseTemp(v: FormDataEntryValue | null): TempZone {
  const s = String(v ?? "");
  return TEMP_VALUES.includes(s) ? (s as TempZone) : "chilled";
}

function parseBadges(formData: FormData): Badge[] {
  return formData
    .getAll("badges")
    .map(String)
    .filter((b): b is Badge => BADGE_VALUES.includes(b));
}

/** 出品ホーム: 売り場に出す / 下げる トグル */
export async function togglePublic(productId: number, isPublic: boolean): Promise<void> {
  const user = await requireUser("seller");
  const p = getProduct(productId);
  if (!p || p.seller_id !== user.id) return;
  setProductPublic(productId, isPublic);
  revalidatePath("/sell");
}

/** リアルタイム出品ウィザード（F-002）: 写真→金額→売りに出す */
export async function createListing(formData: FormData): Promise<void> {
  const user = await requireUser("seller");
  const cost = Math.floor(num(formData.get("cost_price")));
  if (cost <= 0) redirect("/sell/new?error=cost");

  const cats = listCategories();
  const category = cats.find((c) => c.id === num(formData.get("category_id"))) ?? cats[0];
  const qty = Math.max(1, Math.floor(num(formData.get("stock"), 1)));
  const title =
    String(formData.get("title") ?? "").trim() || `本日の${category?.name ?? "おすすめ"}`;
  const photo = String(formData.get("photo") ?? "").trim() || "/img/hokke.svg";

  const id = createProduct({
    seller_id: user.id,
    category_id: category?.id ?? 1,
    title,
    photo,
    cost_price: cost,
    stock: qty,
    temp_zone: parseTemp(formData.get("temp_zone")),
    badges: ["NEW"],
  });
  redirect(`/sell/new/done?id=${id}`);
}

/** 定期商品（テンプレ）から本日分を出品（F-001） */
export async function publishTemplateToday(formData: FormData): Promise<void> {
  const user = await requireUser("seller");
  const templateId = num(formData.get("template_id"));
  const qty = Math.max(1, Math.floor(num(formData.get("qty"), 1)));
  let newId = 0;
  try {
    newId = publishFromTemplate(templateId, user.id, qty);
  } catch {
    redirect("/sell/templates?error=notfound");
  }
  redirect(`/sell/templates?done=${newId}`);
}

/** 新しい定期商品（テンプレート）をつくる */
export async function createTemplate(formData: FormData): Promise<void> {
  const user = await requireUser("seller");
  const title = String(formData.get("title") ?? "").trim();
  const cost = Math.floor(num(formData.get("cost_price")));
  if (!title) redirect("/sell/templates/new?error=title");
  if (cost <= 0) redirect("/sell/templates/new?error=cost");

  createProduct({
    seller_id: user.id,
    category_id: num(formData.get("category_id"), 1),
    title,
    description: String(formData.get("description") ?? ""),
    photo: String(formData.get("photo") ?? "").trim() || "/img/hokke.svg",
    cost_price: cost,
    stock: Math.max(1, Math.floor(num(formData.get("stock"), 1))),
    temp_zone: parseTemp(formData.get("temp_zone")),
    badges: parseBadges(formData),
    is_template: true,
    shipping_fee: Math.max(0, Math.floor(num(formData.get("shipping_fee"), 0))),
    deadline_time: String(formData.get("deadline_time") ?? "").trim() || undefined,
  });
  redirect("/sell/templates?created=1");
}

/** 商品編集の保存（販売価格は原価からサーバー側で再計算） */
export async function saveProduct(formData: FormData): Promise<void> {
  const user = await requireUser("seller");
  const id = num(formData.get("id"));
  const p = getProduct(id);
  if (!p || p.seller_id !== user.id) redirect("/sell");

  const cost = Math.floor(num(formData.get("cost_price")));
  if (cost <= 0) redirect(`/sell/p/${id}/edit?error=cost`);

  const pub = formData.get("is_public");
  updateProduct(id, {
    title: String(formData.get("title") ?? "").trim() || p.title,
    category_id: num(formData.get("category_id"), p.category_id),
    description: String(formData.get("description") ?? ""),
    cost_price: cost,
    stock: Math.max(0, Math.floor(num(formData.get("stock"), p.stock))),
    temp_zone: parseTemp(formData.get("temp_zone")),
    badges: parseBadges(formData),
    shipping_fee: Math.max(0, Math.floor(num(formData.get("shipping_fee"), p.shipping_fee))),
    deadline_time: String(formData.get("deadline_time") ?? "").trim() || p.deadline_time,
    is_public: pub === null ? p.is_public === 1 : String(pub) === "1",
  });
  redirect(p.is_template ? "/sell/templates?saved=1" : "/sell?saved=1");
}

/**
 * AIに説明文を書いてもらう（F-008 デモ）。
 * いまのフォーム内容をいったん保存したうえで、AIの下書きを説明文に入れて保存し、
 * ?ai=1 付きで編集画面に戻す（生成→確認→修正→保存の流れ）。
 */
export async function generateAiDescription(formData: FormData): Promise<void> {
  const user = await requireUser("seller");
  const id = num(formData.get("id"));
  const p = getProduct(id);
  if (!p || p.seller_id !== user.id) redirect("/sell");

  const categoryId = num(formData.get("category_id"), p.category_id);
  const catName =
    listCategories().find((c) => c.id === categoryId)?.name ?? p.category_name ?? "商品";
  const title = String(formData.get("title") ?? "").trim() || p.title;
  const temp = parseTemp(formData.get("temp_zone"));
  const badges = parseBadges(formData);
  const draft = generateDescriptionDraft({
    title,
    categoryName: catName,
    tempZone: temp,
    badges,
  });

  const cost = Math.floor(num(formData.get("cost_price"), p.cost_price));
  const pub = formData.get("is_public");
  updateProduct(id, {
    title,
    category_id: categoryId,
    description: draft.description,
    cost_price: cost > 0 ? cost : p.cost_price,
    stock: Math.max(0, Math.floor(num(formData.get("stock"), p.stock))),
    temp_zone: temp,
    badges,
    shipping_fee: Math.max(0, Math.floor(num(formData.get("shipping_fee"), p.shipping_fee))),
    deadline_time: String(formData.get("deadline_time") ?? "").trim() || p.deadline_time,
    is_public: pub === null ? p.is_public === 1 : String(pub) === "1",
  });
  redirect(`/sell/p/${id}/edit?ai=1`);
}

/** 発送しました（S-09, F-105） */
export async function shipOrder(formData: FormData): Promise<void> {
  const user = await requireUser("seller");
  const orderId = num(formData.get("order_id"));
  try {
    markShipped(orderId, user.id);
  } catch {
    redirect("/sell/orders?error=notfound");
  }
  redirect(`/sell/orders/${orderId}?shipped=1`);
}

/** 欠品キャンセル申請（F-107 管理者承認待ちへ） */
export async function requestOrderCancel(formData: FormData): Promise<void> {
  const user = await requireUser("seller");
  const orderId = num(formData.get("order_id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) redirect(`/sell/orders/${orderId}?error=reason`);
  try {
    requestCancel(orderId, user.id, reason);
  } catch {
    redirect("/sell/orders?error=notfound");
  }
  redirect(`/sell/orders/${orderId}?cancel=1`);
}

/** 今月の売上サマリー（アカウント画面用）。返金済み注文は除外 */
export async function sellerMonthlyStats(): Promise<{
  orders: number;
  sales: number;
  income: number;
}> {
  const user = await requireUser("seller");
  const r = db()
    .prepare(
      `SELECT COUNT(DISTINCT o.id) AS orders,
              COALESCE(SUM(oi.qty * oi.unit_price), 0) AS sales,
              COALESCE(SUM(oi.qty * oi.unit_cost), 0) AS income
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.seller_id = ?
         AND o.created_at >= date('now','localtime','start of month')
         AND o.created_at < date('now','localtime','start of month','+1 month')
         AND o.status != 'refunded'`
    )
    .get(user.id) as unknown as { orders: number; sales: number; income: number };
  return { orders: r.orders, sales: r.sales, income: r.income };
}
