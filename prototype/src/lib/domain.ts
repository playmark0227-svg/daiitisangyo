import { cache } from "react";
import { db } from "./db";
import { salePrice } from "./pricing";
import type {
  Address,
  Category,
  CartLine,
  Notification,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Settings,
  TempZone,
  User,
} from "./types";

/* ---------------- settings ---------------- */

/** リクエスト内で複数回呼ばれるため React cache でメモ化 */
export const getSettings = cache((): Settings => {
  const rows = db().prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    margin_rate: Number(m.margin_rate ?? 15),
    default_deadline: m.default_deadline ?? "13:00",
    service_name: m.service_name ?? "うみさとマルシェ",
  };
});

export function setSetting(key: keyof Settings, value: string) {
  db()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value);
}

/** 原価 → 販売価格（マージン加算、10円単位切り上げ）。F-007 加算モデル */
export function salePriceFromCost(cost: number, marginRate?: number): number {
  const rate = marginRate ?? getSettings().margin_rate;
  return salePrice(cost, rate);
}

/* ---------------- deadline (F-103) ---------------- */

/** サーバー時刻基準で「本日の発送締切を過ぎたか」を判定 */
export function isPastDeadline(deadline: string, now = new Date()): boolean {
  const [h, m] = deadline.split(":").map(Number);
  const cut = new Date(now);
  cut.setHours(h, m ?? 0, 0, 0);
  return now.getTime() > cut.getTime();
}

/** 締切までの残り分数（負なら超過） */
export function minutesToDeadline(deadline: string, now = new Date()): number {
  const [h, m] = deadline.split(":").map(Number);
  const cut = new Date(now);
  cut.setHours(h, m ?? 0, 0, 0);
  return Math.floor((cut.getTime() - now.getTime()) / 60000);
}

/* ---------------- users ---------------- */

export function listUsers(): User[] {
  return db().prepare("SELECT * FROM users ORDER BY role, id").all() as unknown as User[];
}

export function getUserById(id: number): User | null {
  return (db().prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as User) ?? null;
}

export function setUserActive(id: number, active: boolean) {
  db().prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
}

export function listInviteCodes() {
  return db().prepare("SELECT * FROM invite_codes").all() as unknown as {
    code: string;
    role: string;
    note: string;
    used_by: number | null;
  }[];
}

/** 招待コードで会員登録（F-108/F-205 クローズドβ） */
export function registerByInvite(
  code: string,
  name: string,
  org: string,
  phone: string
): { ok: true; userId: number } | { ok: false; error: string } {
  const inv = db()
    .prepare("SELECT * FROM invite_codes WHERE code = ?")
    .get(code.trim().toUpperCase()) as unknown as { code: string; role: string } | undefined;
  if (!inv) return { ok: false, error: "招待コードが見つかりません。配布されたQRコードのコードをご確認ください。" };
  const r = db()
    .prepare("INSERT INTO users (name, role, org, phone) VALUES (?,?,?,?)")
    .run(name, inv.role, org, phone);
  const userId = Number(r.lastInsertRowid);
  // 最後に登録した利用者を記録（管理画面で追跡できるように）
  db().prepare("UPDATE invite_codes SET used_by = ? WHERE code = ?").run(userId, inv.code);
  return { ok: true, userId };
}

/* ---------------- categories ---------------- */

export function listCategories(): Category[] {
  // node:sqlite の行は null プロトタイプのため、クライアントコンポーネントへ
  // props として渡せるようプレーンオブジェクトに変換する
  const rows = db().prepare("SELECT * FROM categories ORDER BY sort, id").all() as unknown as Category[];
  return rows.map((r) => ({ ...r }));
}

export function saveCategory(name: string, sort: number, id?: number) {
  if (id) db().prepare("UPDATE categories SET name = ?, sort = ? WHERE id = ?").run(name, sort, id);
  else db().prepare("INSERT INTO categories (name, sort) VALUES (?, ?)").run(name, sort);
}

/* ---------------- products ---------------- */

const PRODUCT_SELECT = `
  SELECT p.*, u.org AS seller_name, c.name AS category_name
  FROM products p
  JOIN users u ON u.id = p.seller_id
  JOIN categories c ON c.id = p.category_id`;

export function listPublicProducts(categoryId?: number): Product[] {
  const base = `${PRODUCT_SELECT} WHERE p.is_public = 1 AND p.is_template = 0`;
  const rows = categoryId
    ? db().prepare(`${base} AND p.category_id = ? ORDER BY p.created_at DESC, p.id DESC`).all(categoryId)
    : db().prepare(`${base} ORDER BY p.created_at DESC, p.id DESC`).all();
  return rows as unknown as Product[];
}

export function listSellerProducts(sellerId: number, opts?: { templates?: boolean }): Product[] {
  const t = opts?.templates ? 1 : 0;
  return db()
    .prepare(`${PRODUCT_SELECT} WHERE p.seller_id = ? AND p.is_template = ? ORDER BY p.id DESC`)
    .all(sellerId, t) as unknown as Product[];
}

export function listAllProducts(): Product[] {
  return db().prepare(`${PRODUCT_SELECT} ORDER BY p.id DESC`).all() as unknown as Product[];
}

export function getProduct(id: number): Product | null {
  return (db().prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id) as unknown as Product) ?? null;
}

/** 複数商品の一括取得（カート表示・注文処理のN+1回避） */
export function getProductsByIds(ids: number[]): Map<number, Product> {
  const map = new Map<number, Product>();
  if (ids.length === 0) return map;
  const rows = db()
    .prepare(`${PRODUCT_SELECT} WHERE p.id IN (${ids.map(() => "?").join(",")})`)
    .all(...ids) as unknown as Product[];
  for (const r of rows) map.set(r.id, r);
  return map;
}

export interface ProductInput {
  seller_id: number;
  category_id: number;
  title: string;
  description?: string;
  photo?: string;
  cost_price: number;
  stock?: number;
  temp_zone?: TempZone;
  badges?: string[];
  is_public?: boolean;
  is_template?: boolean;
  shipping_fee?: number;
  deadline_time?: string;
}

/** 出品（リアルタイム出品 F-002 / 定期テンプレ F-001）。販売価格はサーバー側で自動計算 */
export function createProduct(input: ProductInput): number {
  const s = getSettings();
  const sale = salePriceFromCost(input.cost_price, s.margin_rate);
  const r = db()
    .prepare(
      `INSERT INTO products
       (seller_id, category_id, title, description, photo, cost_price, sale_price, stock,
        temp_zone, badges, is_public, is_template, shipping_fee, deadline_time)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      input.seller_id,
      input.category_id,
      input.title,
      input.description ?? "",
      input.photo ?? "",
      input.cost_price,
      sale,
      input.stock ?? 1,
      input.temp_zone ?? "chilled",
      JSON.stringify(input.badges ?? []),
      input.is_public === false ? 0 : 1,
      input.is_template ? 1 : 0,
      input.shipping_fee ?? 0,
      input.deadline_time ?? s.default_deadline
    );
  const id = Number(r.lastInsertRowid);
  if (!input.is_template && input.is_public !== false) {
    notifyRole("buyer", "new_product", `新着：${input.title} が出品されました`, `/shop/p/${id}`);
  }
  return id;
}

export function updateProduct(id: number, patch: Partial<ProductInput>) {
  const p = getProduct(id);
  if (!p) throw new Error("product not found");
  const cost = patch.cost_price ?? p.cost_price;
  const sale = patch.cost_price !== undefined ? salePriceFromCost(cost) : p.sale_price;
  db()
    .prepare(
      `UPDATE products SET
        category_id = ?, title = ?, description = ?, photo = ?,
        cost_price = ?, sale_price = ?, stock = ?, temp_zone = ?,
        badges = ?, is_public = ?, shipping_fee = ?, deadline_time = ?
       WHERE id = ?`
    )
    .run(
      patch.category_id ?? p.category_id,
      patch.title ?? p.title,
      patch.description ?? p.description,
      patch.photo ?? p.photo,
      cost,
      sale,
      patch.stock ?? p.stock,
      patch.temp_zone ?? p.temp_zone,
      patch.badges ? JSON.stringify(patch.badges) : p.badges,
      patch.is_public === undefined ? p.is_public : patch.is_public ? 1 : 0,
      patch.shipping_fee ?? p.shipping_fee,
      patch.deadline_time ?? p.deadline_time,
      id
    );
}

export function setProductPublic(id: number, isPublic: boolean) {
  db().prepare("UPDATE products SET is_public = ? WHERE id = ?").run(isPublic ? 1 : 0, id);
}

/** 定期テンプレートから本日分を出品（数量のみ入力） */
export function publishFromTemplate(templateId: number, sellerId: number, qty: number): number {
  const t = getProduct(templateId);
  if (!t || !t.is_template || t.seller_id !== sellerId) throw new Error("template not found");
  return createProduct({
    seller_id: sellerId,
    category_id: t.category_id,
    title: t.title,
    description: t.description,
    photo: t.photo,
    cost_price: t.cost_price,
    stock: qty,
    temp_zone: t.temp_zone as TempZone,
    badges: JSON.parse(t.badges),
    shipping_fee: t.shipping_fee,
    deadline_time: t.deadline_time,
  });
}

/* ---------------- cart & checkout (F-006/F-101/F-104) ---------------- */

export interface CheckoutResult {
  ok: boolean;
  orderIds?: number[];
  error?: string;
}

/**
 * 注文確定。在庫チェック→減算→注文作成を単一トランザクションで実行し、
 * 売り越し（オーバーセル）を防止する（F-006）。
 *
 * 注文は出品者ごとに分割して作成する（1出品者=1注文）。これにより
 * 各出品者が自分の注文だけを独立して発送/欠品処理でき、複数出品者の
 * 商品を1回のカートで買っても状態が混線しない（Stripe Connectの送金単位とも一致）。
 */
export function placeOrder(
  buyerId: number,
  lines: CartLine[],
  address: { label: string; address: string }
): CheckoutResult {
  if (lines.length === 0) return { ok: false, error: "カートが空です。" };
  const d = db();
  try {
    d.exec("BEGIN IMMEDIATE");
    // トランザクション内で一括取得（在庫チェックと同一スナップショット）
    const products = getProductsByIds(lines.map((l) => l.productId));
    // 出品者ごとに明細をまとめる
    const bySeller = new Map<number, { p: Product; qty: number }[]>();

    for (const line of lines) {
      const p = products.get(line.productId);
      if (!p || !p.is_public || p.is_template) {
        d.exec("ROLLBACK");
        return { ok: false, error: "取り扱いが終了した商品がカートに含まれています。" };
      }
      if (isPastDeadline(p.deadline_time)) {
        d.exec("ROLLBACK");
        return { ok: false, error: `「${p.title}」は本日の注文締切（${p.deadline_time}）を過ぎました。` };
      }
      if (p.stock < line.qty) {
        d.exec("ROLLBACK");
        return { ok: false, error: `「${p.title}」の在庫が不足しています（残り${p.stock}）。` };
      }
      // アトミックな条件付き減算（同時注文の競合対策）
      const r = d
        .prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?")
        .run(line.qty, p.id, line.qty);
      if (Number(r.changes) === 0) {
        d.exec("ROLLBACK");
        return { ok: false, error: `「${p.title}」は先ほど売り切れました。` };
      }
      const group = bySeller.get(p.seller_id) ?? [];
      group.push({ p, qty: line.qty });
      bySeller.set(p.seller_id, group);
    }

    const insOrder = d.prepare(
      `INSERT INTO orders (buyer_id, status, items_total, shipping_total, grand_total, address, address_label)
       VALUES (?,?,?,?,?,?,?)`
    );
    const insItem = d.prepare(
      `INSERT INTO order_items (order_id, product_id, seller_id, title, photo, temp_zone, qty, unit_price, unit_cost)
       VALUES (?,?,?,?,?,?,?,?,?)`
    );

    const created: { sellerId: number; orderId: number }[] = [];
    for (const [sellerId, group] of bySeller) {
      const itemsTotal = group.reduce((s, { p, qty }) => s + p.sale_price * qty, 0);
      const shipping = group.reduce((m, { p }) => Math.max(m, p.shipping_fee), 0); // 出品者ごとに1梱包
      const grand = itemsTotal + shipping;
      const or = insOrder.run(buyerId, "paid", itemsTotal, shipping, grand, address.address, address.label);
      const orderId = Number(or.lastInsertRowid);
      for (const { p, qty } of group) {
        insItem.run(orderId, p.id, p.seller_id, p.title, p.photo, p.temp_zone, qty, p.sale_price, p.cost_price);
      }
      created.push({ sellerId, orderId });
    }
    d.exec("COMMIT");

    // 通知はトランザクション外で（出品者ごとに自分の注文へ）
    for (const { sellerId, orderId } of created) {
      notifyUser(sellerId, "new_order", `新しい注文が入りました（注文 #${orderId}）`, `/sell/orders/${orderId}`);
    }
    return { ok: true, orderIds: created.map((c) => c.orderId) };
  } catch (e) {
    try {
      d.exec("ROLLBACK");
    } catch {}
    return { ok: false, error: "注文処理でエラーが発生しました。もう一度お試しください。" };
  }
}

/* ---------------- orders ---------------- */

export function getOrder(id: number): (Order & { items: OrderItem[] }) | null {
  const o = db()
    .prepare(
      `SELECT o.*, u.name AS buyer_name, u.org AS buyer_org
       FROM orders o JOIN users u ON u.id = o.buyer_id WHERE o.id = ?`
    )
    .get(id) as unknown as Order | undefined;
  if (!o) return null;
  const items = db()
    .prepare(
      `SELECT oi.*, u.org AS seller_name FROM order_items oi
       JOIN users u ON u.id = oi.seller_id WHERE oi.order_id = ?`
    )
    .all(id) as unknown as OrderItem[];
  return { ...o, items };
}

export function listBuyerOrders(buyerId: number): Order[] {
  return db()
    .prepare("SELECT * FROM orders WHERE buyer_id = ? ORDER BY id DESC")
    .all(buyerId) as unknown as Order[];
}

/** 出品者に関係する注文（自分の商品が含まれる注文） */
export function listSellerOrders(sellerId: number): (Order & { my_qty: number; my_total: number })[] {
  return db()
    .prepare(
      `SELECT o.*, u.name AS buyer_name, u.org AS buyer_org,
              SUM(oi.qty) AS my_qty, SUM(oi.qty * oi.unit_price) AS my_total
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id AND oi.seller_id = ?
       JOIN users u ON u.id = o.buyer_id
       GROUP BY o.id ORDER BY o.id DESC`
    )
    .all(sellerId) as unknown as (Order & { my_qty: number; my_total: number })[];
}

export function listAllOrders(limit?: number): Order[] {
  const base = `SELECT o.*, u.name AS buyer_name, u.org AS buyer_org
       FROM orders o JOIN users u ON u.id = o.buyer_id ORDER BY o.id DESC`;
  const rows = limit
    ? db().prepare(`${base} LIMIT ?`).all(limit)
    : db().prepare(base).all();
  return rows as unknown as Order[];
}

/** 管理画面の注文一覧用: 商品点数を集約して1クエリで取得（注文ごとのgetOrder N+1を回避） */
export function listAllOrdersWithCounts(): (Order & { item_count: number })[] {
  return db()
    .prepare(
      `SELECT o.*, u.name AS buyer_name, u.org AS buyer_org,
              COALESCE(SUM(oi.qty), 0) AS item_count
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id ORDER BY o.id DESC`
    )
    .all() as unknown as (Order & { item_count: number })[];
}

/** 現在ステータスが期待値のときだけ遷移させる（古い画面からの不正遷移を防ぐ）。成功したらtrue */
function transitionStatus(orderId: number, from: OrderStatus, to: OrderStatus): boolean {
  const r = db()
    .prepare("UPDATE orders SET status = ? WHERE id = ? AND status = ?")
    .run(to, orderId, from);
  return Number(r.changes) > 0;
}

/** 発送済みにする（出品者 S-09）。paid のときだけ遷移可 */
export function markShipped(orderId: number, sellerId: number) {
  const o = getOrder(orderId);
  if (!o) throw new Error("order not found");
  if (!o.items.some((i) => i.seller_id === sellerId)) throw new Error("not your order");
  if (!transitionStatus(orderId, "paid", "shipped")) throw new Error("invalid transition");
  notifyUser(o.buyer_id, "shipped", `注文 #${orderId} が発送されました`, `/shop/orders/${orderId}`);
}

/** 欠品キャンセル申請（出品者 → 管理者承認待ち、F-107）。paid のときだけ申請可 */
export function requestCancel(orderId: number, sellerId: number, reason: string) {
  const o = getOrder(orderId);
  if (!o) throw new Error("order not found");
  if (!o.items.some((i) => i.seller_id === sellerId)) throw new Error("not your order");
  if (!transitionStatus(orderId, "paid", "cancel_requested")) throw new Error("invalid transition");
  notifyRole("admin", "cancel_request", `注文 #${orderId} に欠品キャンセル申請（理由: ${reason}）`, `/admin/orders/${orderId}`);
}

/** 管理者: キャンセル承認 → 返金（デモ）＋在庫戻し。二重返金は在庫が水増しされるため条件付き更新で防ぐ */
export function approveCancelAndRefund(orderId: number) {
  const o = getOrder(orderId);
  if (!o) throw new Error("order not found");
  if (o.status === "refunded") return; // 再送・連打対策
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    // 先にstatusを条件付きで更新し、勝てた場合のみ在庫を戻す（競合時の二重加算防止）
    const r = d
      .prepare("UPDATE orders SET status = 'refunded' WHERE id = ? AND status != 'refunded'")
      .run(orderId);
    if (Number(r.changes) === 0) {
      d.exec("ROLLBACK");
      return;
    }
    for (const it of o.items) {
      d.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(it.qty, it.product_id);
    }
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
  notifyUser(o.buyer_id, "refunded", `注文 #${orderId} は欠品のため全額返金されました`, `/shop/orders/${orderId}`);
}

/* ---------------- addresses ---------------- */

export function listAddresses(buyerId: number): Address[] {
  return db().prepare("SELECT * FROM addresses WHERE buyer_id = ? ORDER BY id").all(buyerId) as unknown as Address[];
}

export function addAddress(buyerId: number, label: string, address: string) {
  db().prepare("INSERT INTO addresses (buyer_id, label, address) VALUES (?,?,?)").run(buyerId, label, address);
}

/* ---------------- notifications (F-203 デモ版) ---------------- */

export function notifyUser(userId: number, type: string, message: string, link = "") {
  db()
    .prepare("INSERT INTO notifications (user_id, type, message, link) VALUES (?,?,?,?)")
    .run(userId, type, message, link);
}

export function notifyRole(role: string, type: string, message: string, link = "") {
  // 1文のINSERT...SELECTで一括作成（対象ユーザー数に比例するループINSERTを回避）
  db()
    .prepare(
      "INSERT INTO notifications (user_id, type, message, link) SELECT id, ?, ?, ? FROM users WHERE role = ? AND active = 1"
    )
    .run(type, message, link, role);
}

export function listNotifications(userId: number, limit = 30): Notification[] {
  return db()
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit) as unknown as Notification[];
}

export function unreadCount(userId: number): number {
  const r = db().prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0").get(userId) as unknown as { c: number };
  return r.c;
}

export function markAllRead(userId: number) {
  db().prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId);
}

/* ---------------- dashboard & reporting (F-202/F-208) ---------------- */

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  monthSales: number;
  monthOrders: number;
  monthMargin: number; // 手数料収益（概算）
  publicProducts: number;
  recentOrders: Order[];
}

export function dashboardStats(): DashboardStats {
  const d = db();
  // 列側に関数を適用せず範囲比較にする（created_atはローカル時刻のTEXT格納なので辞書順比較で正しい）
  const today = d
    .prepare(
      `SELECT COALESCE(SUM(grand_total),0) AS s, COUNT(*) AS c FROM orders
       WHERE created_at >= date('now','localtime')
         AND created_at < date('now','localtime','+1 day')
         AND status != 'refunded'`
    )
    .get() as unknown as { s: number; c: number };
  const month = d
    .prepare(
      `SELECT COALESCE(SUM(grand_total),0) AS s, COUNT(*) AS c FROM orders
       WHERE created_at >= date('now','localtime','start of month')
         AND created_at < date('now','localtime','start of month','+1 month')
         AND status != 'refunded'`
    )
    .get() as unknown as { s: number; c: number };
  const margin = d
    .prepare(
      `SELECT COALESCE(SUM((oi.unit_price - oi.unit_cost) * oi.qty),0) AS m
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= date('now','localtime','start of month')
         AND o.created_at < date('now','localtime','start of month','+1 month')
         AND o.status != 'refunded'`
    )
    .get() as unknown as { m: number };
  const products = d
    .prepare("SELECT COUNT(*) AS c FROM products WHERE is_public = 1 AND is_template = 0")
    .get() as unknown as { c: number };
  return {
    todaySales: today.s,
    todayOrders: today.c,
    monthSales: month.s,
    monthOrders: month.c,
    monthMargin: margin.m,
    publicProducts: products.c,
    recentOrders: listAllOrders(8),
  };
}

/** 税率区分付き取引明細CSV（F-208。食品=軽減税率8%を仮置き） */
export function ordersCsv(): string {
  const rows = db()
    .prepare(
      `SELECT o.id AS order_id, o.created_at, o.status, ub.org AS buyer,
              us.org AS seller, oi.title, oi.qty, oi.unit_price, oi.unit_cost
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN users ub ON ub.id = o.buyer_id
       JOIN users us ON us.id = oi.seller_id
       ORDER BY o.id DESC`
    )
    .all() as unknown as Record<string, string | number>[];
  const header = "注文ID,注文日時,ステータス,発注者,出品者,商品名,数量,販売単価(税込),原価単価,手数料(マージン),税率区分,税額(概算)";
  const lines = rows.map((r) => {
    const qty = Number(r.qty);
    const price = Number(r.unit_price);
    const cost = Number(r.unit_cost);
    const margin = (price - cost) * qty;
    const taxRate = "8%(軽減)";
    const tax = Math.floor((price * qty * 8) / 108);
    // フォーミュラ(CSV)インジェクション対策: =+-@等で始まるセルはクオート接頭辞で無害化
    const esc = (v: string | number) => {
      const s = String(v);
      const safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    return [r.order_id, r.created_at, r.status, esc(String(r.buyer)), esc(String(r.seller)), esc(String(r.title)), qty, price, cost, margin, taxRate, tax].join(",");
  });
  return "﻿" + [header, ...lines].join("\n");
}

/* ---------------- AI description (F-008/F-009 デモ版) ---------------- */

/**
 * AI商品説明の自動生成（デモ）。本番はClaude API等のVision対応LLMに置き換える。
 * デモではカテゴリ・温度帯・バッジからテンプレート合成で下書きを返す。
 */
export function generateDescriptionDraft(input: {
  title: string;
  categoryName: string;
  tempZone: TempZone;
  badges: string[];
}): { title: string; description: string } {
  const { title, categoryName, tempZone, badges } = input;
  const fresh = badges.includes("朝どれ") ? "今朝獲れたばかりの" : badges.includes("訳あり") ? "市場に出回らない訳あり品の" : "北海道産の";
  const temp = tempZone === "frozen" ? "冷凍便" : tempZone === "chilled" ? "冷蔵（クール）便" : "常温便";
  const use = categoryName === "鮮魚" ? "お刺身・焼き物などお店の一品に" : categoryName === "野菜" ? "仕込み・惣菜の材料に" : "店頭・加工用に";
  const t = title || `${fresh}${categoryName}`;
  const d = `${fresh}${categoryName}です。${use}おすすめです。${temp}でお届けします。\n※この説明文はAIが下書きしました。内容をご確認のうえ、必要に応じて修正してください。`;
  return { title: t, description: d };
}
