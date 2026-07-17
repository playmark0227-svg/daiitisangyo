import Link from "next/link";
import { isPastDeadline, minutesToDeadline } from "@/lib/domain";
import { TEMP_LABEL, type Product, type TempZone } from "@/lib/types";

/** 金額表示（税込）。例: 4,370円 */
export function yen(n: number): string {
  return n.toLocaleString("ja-JP") + "円";
}

export function parseBadges(json: string): string[] {
  try {
    const a = JSON.parse(json) as unknown;
    return Array.isArray(a) ? (a as string[]) : [];
  } catch {
    return [];
  }
}

/** 写真が未登録のときのプレースホルダ */
export const PHOTO_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='240' height='240' fill='#e7edf2'/><text x='120' y='134' font-size='44' text-anchor='middle'>&#128247;</text></svg>`
  );

export function photoSrc(photo: string): string {
  return photo || PHOTO_FALLBACK;
}

/** バッジ（NEW/人気/朝どれ/訳あり）＋温度帯バッジ */
export function ProductBadges({ product }: { product: Product }) {
  const badges = parseBadges(product.badges);
  return (
    <span className="badges">
      {badges.map((b) => (
        <span key={b} className={`badge badge-${b}`}>
          {b}
        </span>
      ))}
      <span className="badge badge-temp">{TEMP_LABEL[product.temp_zone as TempZone]}</span>
    </span>
  );
}

/** 締切チップ: 「13:00までの注文で当日発送」「残り○分」「本日分は締切済み」 */
export function DeadlineChip({ deadline, stock }: { deadline: string; stock: number }) {
  if (stock === 0) return <span className="soldout">売り切れ</span>;
  if (isPastDeadline(deadline)) return <span className="deadline past">本日分は締切済み</span>;
  const min = minutesToDeadline(deadline);
  if (min <= 90) return <span className="deadline">締切まで残り{min}分</span>;
  return <span className="deadline">{deadline}までの注文で当日発送</span>;
}

/** 商品フィード（ホーム/カテゴリ共用） */
export function ProductFeed({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="muted" style={{ textAlign: "center", padding: "34px 0" }}>
        ただいま出品中の商品はありません。
      </p>
    );
  }
  return (
    <div className="list">
      {products.map((p) => {
        const soldout = p.stock === 0;
        const past = isPastDeadline(p.deadline_time);
        return (
          <Link
            key={p.id}
            href={`/shop/p/${p.id}`}
            className="pcard"
            style={soldout || past ? { opacity: 0.55 } : undefined}
          >
            <img className="pc-photo" src={photoSrc(p.photo)} alt={p.title} />
            <span className="pc-body" style={{ display: "block" }}>
              <ProductBadges product={p} />
              <span className="pc-title" style={{ display: "block" }}>
                {p.title}
              </span>
              <span className="pc-meta" style={{ display: "block" }}>
                {p.seller_name}
              </span>
              <span className="pc-price" style={{ display: "block", marginTop: 2 }}>
                {yen(p.sale_price)}
                <small>（税込）</small>
              </span>
              <span className="row" style={{ gap: 8, marginTop: 2 }}>
                <DeadlineChip deadline={p.deadline_time} stock={p.stock} />
                {!soldout && <span className="pc-meta">残り{p.stock}点</span>}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
