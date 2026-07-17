import { cookies } from "next/headers";
import { getProduct, isPastDeadline } from "@/lib/domain";
import type { CartLine, Product } from "@/lib/types";

/** カートcookie名（値は JSON.stringify(CartLine[])） */
export const CART_COOKIE = "cart";

/** cookieからカートを読み取る（サーバーコンポーネント/サーバーアクション共用） */
export async function readCart(): Promise<CartLine[]> {
  const jar = await cookies();
  const raw = jar.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((l) => ({
        productId: Number((l as CartLine)?.productId),
        qty: Math.floor(Number((l as CartLine)?.qty)),
      }))
      .filter((l) => Number.isFinite(l.productId) && l.productId > 0 && l.qty > 0);
  } catch {
    return [];
  }
}

export type CartProblem = "" | "unavailable" | "soldout" | "shortage" | "deadline";

export interface CartRow {
  line: CartLine;
  product: Product | null;
  problem: CartProblem;
  problemText: string;
}

export interface CartView {
  rows: CartRow[];
  itemsTotal: number;
  shippingTotal: number;
  grandTotal: number;
  count: number;
  hasProblem: boolean;
}

/**
 * カート表示用ビューを組み立てる。
 * 送料は domain.placeOrder と同一ルール:
 * 「出品者ごとに shipping_fee の最大値を1回だけ課金（出品者ごとに1梱包）」
 */
export function buildCartView(lines: CartLine[]): CartView {
  const rows: CartRow[] = lines.map((line) => {
    const p = getProduct(line.productId);
    if (!p || !p.is_public || p.is_template) {
      return {
        line,
        product: null,
        problem: "unavailable" as const,
        problemText: "この商品は取り扱いが終了しました。「削除」を押してください。",
      };
    }
    if (isPastDeadline(p.deadline_time)) {
      return {
        line,
        product: p,
        problem: "deadline" as const,
        problemText: `本日の注文締切（${p.deadline_time}）を過ぎています。明日の出品をお待ちください。`,
      };
    }
    if (p.stock === 0) {
      return {
        line,
        product: p,
        problem: "soldout" as const,
        problemText: "売り切れました。「削除」を押してください。",
      };
    }
    if (p.stock < line.qty) {
      return {
        line,
        product: p,
        problem: "shortage" as const,
        problemText: `在庫が足りません（残り${p.stock}点）。数量を減らしてください。`,
      };
    }
    return { line, product: p, problem: "" as const, problemText: "" };
  });

  let itemsTotal = 0;
  let count = 0;
  const sellerFees = new Map<number, number>();
  for (const r of rows) {
    if (!r.product) continue;
    itemsTotal += r.product.sale_price * r.line.qty;
    count += r.line.qty;
    sellerFees.set(
      r.product.seller_id,
      Math.max(sellerFees.get(r.product.seller_id) ?? 0, r.product.shipping_fee)
    );
  }
  const shippingTotal = [...sellerFees.values()].reduce((a, b) => a + b, 0);
  return {
    rows,
    itemsTotal,
    shippingTotal,
    grandTotal: itemsTotal + shippingTotal,
    count,
    hasProblem: rows.some((r) => r.problem !== ""),
  };
}
