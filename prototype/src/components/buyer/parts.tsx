import Link from "next/link";
import Badges from "@/components/Badges";
import { yen } from "@/lib/format";
import { DEFAULT_PHOTO, photoForCategory } from "@/lib/catalog";
import { isPastDeadline, minutesToDeadline } from "@/lib/domain";
import type { Product } from "@/lib/types";

/**
 * 写真が未登録のときのプレースホルダ。
 * catalog.ts のカテゴリ別デフォルト画像に統一（カテゴリ不明時は DEFAULT_PHOTO）。
 */
export function photoSrc(photo: string, category?: string): string {
  return photo || photoForCategory(category) || DEFAULT_PHOTO;
}

/** 締切チップ: 「HH:MMまでの注文で当日発送」「締切まで残り○分」「本日分は締切済み」「売り切れ」 */
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
            <img className="pc-photo" src={photoSrc(p.photo, p.category_name)} alt={p.title} />
            <div className="pc-body">
              <Badges badges={p.badges} temp={p.temp_zone} />
              <div className="pc-title">{p.title}</div>
              <div className="pc-meta">{p.seller_name}</div>
              <div className="pc-price" style={{ marginTop: 2 }}>
                {yen(p.sale_price)}
                <small>（税込）</small>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 2 }}>
                <DeadlineChip deadline={p.deadline_time} stock={p.stock} />
                {!soldout && <span className="pc-meta">残り{p.stock}点</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
