import Link from "next/link";
import { requireUser } from "@/lib/session";
import { clearCart, removeLine, updateQty } from "@/actions/buyer";
import { buildCartView, readCart } from "@/components/buyer/cart-view";
import { yen } from "@/lib/format";
import { photoSrc } from "@/components/buyer/parts";

export default async function CartPage() {
  await requireUser("buyer");
  const lines = await readCart();
  const view = buildCartView(lines);

  if (view.rows.length === 0) {
    return (
      <>
        <div className="sec-h" style={{ marginTop: 4 }}>カート</div>
        <div className="card" style={{ textAlign: "center", padding: "30px 16px" }}>
          <div style={{ fontSize: 38 }}>🛒</div>
          <p style={{ fontWeight: 800, margin: "8px 0" }}>カートは空です</p>
          <p className="muted" style={{ margin: "0 0 14px" }}>
            本日の商品から気になるものを入れてみましょう。
          </p>
          <Link href="/shop" className="btn btn-primary btn-block">
            本日の商品を見る
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sec-h" style={{ marginTop: 4 }}>
        カート<span className="sec-sub">{view.count}点</span>
      </div>

      {view.rows.map((r) => {
        const p = r.product;
        const qtyMax = p ? Math.min(Math.max(p.stock, 1), 30) : 1;
        return (
          <div className="card" key={r.line.productId}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <img
                src={photoSrc(p?.photo ?? "", p?.category_name)}
                alt={p?.title ?? "取り扱い終了した商品"}
                style={{
                  width: 62,
                  height: 62,
                  objectFit: "cover",
                  borderRadius: 10,
                  background: "var(--surface-2)",
                  flex: "none",
                }}
              />
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.45 }}>
                  {p ? (
                    <Link href={`/shop/p/${p.id}`} style={{ color: "inherit" }}>
                      {p.title}
                    </Link>
                  ) : (
                    "取り扱いが終了した商品"
                  )}
                </div>
                {p && (
                  <>
                    <div className="muted">
                      {yen(p.sale_price)} × {r.line.qty}点
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {yen(p.sale_price * r.line.qty)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {r.problem !== "" && (
              <div className="error-box" style={{ margin: "10px 0 0" }}>
                {r.problemText}
              </div>
            )}

            <div className="row" style={{ marginTop: 10 }}>
              {p && p.stock > 0 ? (
                <form action={updateQty} className="row grow" style={{ gap: 8 }}>
                  <input type="hidden" name="productId" value={r.line.productId} />
                  <select
                    className="input"
                    name="qty"
                    defaultValue={String(Math.min(r.line.qty, qtyMax))}
                    style={{ width: 82, padding: "8px 10px", fontSize: 15 }}
                    aria-label="数量"
                  >
                    {Array.from({ length: qtyMax }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-ghost btn-sm" type="submit">
                    数量を変更
                  </button>
                </form>
              ) : (
                <span className="grow" />
              )}
              <form action={removeLine}>
                <input type="hidden" name="productId" value={r.line.productId} />
                <button className="btn btn-danger btn-sm" type="submit">
                  削除
                </button>
              </form>
            </div>
          </div>
        );
      })}

      <div className="card" style={{ marginTop: 12 }}>
        <div className="total-row">
          <span>商品合計</span>
          <span>{yen(view.itemsTotal)}</span>
        </div>
        <div className="total-row">
          <span>
            送料<small className="muted">（出品者ごとに1回）</small>
          </span>
          <span>{yen(view.shippingTotal)}</span>
        </div>
        <div className="total-row grand">
          <span>合計（税込）</span>
          <span>{yen(view.grandTotal)}</span>
        </div>
      </div>

      {view.hasProblem && (
        <div className="error-box" style={{ marginTop: 12 }}>
          赤い表示のある商品はこのままではご注文いただけません。数量の変更または削除をお願いします。
        </div>
      )}

      <Link
        href="/shop/checkout"
        className="btn btn-primary btn-xl btn-block"
        style={{ marginTop: 12 }}
      >
        注文へ進む →
      </Link>
      <Link href="/shop" className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>
        買い物を続ける
      </Link>
      <form action={clearCart} style={{ marginTop: 10 }}>
        <button className="btn btn-danger btn-block btn-sm" type="submit">
          カートを空にする
        </button>
      </form>
    </>
  );
}
