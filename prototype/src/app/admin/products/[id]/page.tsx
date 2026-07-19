import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, listCategories } from "@/lib/domain";
import { TEMP_LABEL, type TempZone } from "@/lib/types";
import { adminUpdateProduct } from "@/actions/admin";
import { yen } from "@/lib/format";
import { BADGE_OPTIONS, parseBadges } from "@/lib/catalog";

export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { id } = await params;
  const { done, error } = await searchParams;
  const product = getProduct(Number(id));
  if (!product) notFound();
  const categories = listCategories();
  const badges = parseBadges(product.badges);

  return (
    <>
      <h1 className="admin-h1">
        商品の編集 <span className="muted">#{product.id}</span>
      </h1>
      <p style={{ margin: "0 0 14px" }}>
        <Link href="/admin/products">← 商品一覧へ戻る</Link>
      </p>

      {done === "1" && <div className="ok-box">変更を保存しました。</div>}
      {error === "deadline" && (
        <div className="error-box">締切時刻の形式が正しくありません（例: 13:00）。</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>
        <div className="card">
          {product.photo ? (
            <img
              src={product.photo}
              alt={product.title}
              style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, background: "var(--surface-2)" }}
            />
          ) : (
            <div style={{ width: "100%", height: 180, borderRadius: 10, background: "var(--surface-2)" }} />
          )}
          <div style={{ fontWeight: 800, margin: "10px 0 2px" }}>
            {product.title}
            {product.is_template === 1 && (
              <span className="badge badge-temp" style={{ marginLeft: 6 }}>
                定期
              </span>
            )}
          </div>
          <div className="muted">出品者: {product.seller_name}</div>
          <div className="total-row" style={{ marginTop: 8 }}>
            <span>原価</span>
            <span>{yen(product.cost_price)}</span>
          </div>
          <div className="total-row">
            <span>販売価格（税込）</span>
            <span style={{ fontWeight: 800 }}>{yen(product.sale_price)}</span>
          </div>
          <div className="total-row">
            <span>在庫</span>
            <span>{product.stock === 0 ? <span className="soldout">売り切れ</span> : `${product.stock} 点`}</span>
          </div>
          <div className="total-row">
            <span>温度帯</span>
            <span className="badge badge-temp">{TEMP_LABEL[product.temp_zone as TempZone]}</span>
          </div>
          <p className="muted" style={{ margin: "10px 0 0" }}>
            価格・在庫・写真は出品者側で管理します。
          </p>
        </div>

        <form action={adminUpdateProduct} className="card">
          <input type="hidden" name="id" value={product.id} />

          <div className="field">
            <label htmlFor="category_id">カテゴリ</label>
            <select id="category_id" className="input" name="category_id" defaultValue={product.category_id}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>バッジ（当てはまるものに印を付けてください）</label>
            <div className="row" style={{ flexWrap: "wrap", gap: 14 }}>
              {BADGE_OPTIONS.map((b) => (
                <label key={b} className="row" style={{ gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="badges"
                    value={b}
                    defaultChecked={badges.includes(b)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span className={`badge badge-${b}`}>{b}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label>公開状態</label>
            <div className="seg">
              <label>
                <input type="radio" name="is_public" value="1" defaultChecked={product.is_public === 1} />
                <span>売り場に出す</span>
              </label>
              <label>
                <input type="radio" name="is_public" value="0" defaultChecked={product.is_public !== 1} />
                <span>売り場から下げる</span>
              </label>
            </div>
          </div>

          <div className="field">
            <label htmlFor="deadline_time">当日発送の締切時刻</label>
            <input
              id="deadline_time"
              className="input"
              type="time"
              name="deadline_time"
              defaultValue={product.deadline_time}
              style={{ maxWidth: 180 }}
            />
            <span className="hint">例: 13:00 → 「13:00までの注文で当日発送」と表示されます。</span>
          </div>

          <button className="btn btn-primary" type="submit">
            変更を保存する
          </button>
        </form>
      </div>
    </>
  );
}
