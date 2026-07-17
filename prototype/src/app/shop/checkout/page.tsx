import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listAddresses } from "@/lib/domain";
import { placeOrderAction } from "@/actions/buyer";
import { buildCartView, readCart } from "@/components/buyer/cart-view";
import { yen } from "@/components/buyer/parts";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser("buyer");
  const { error } = await searchParams;
  const lines = await readCart();
  const view = buildCartView(lines);

  if (view.rows.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "30px 16px" }}>
        <p style={{ fontWeight: 800, margin: "6px 0" }}>カートが空です</p>
        <Link href="/shop" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
          本日の商品を見る
        </Link>
      </div>
    );
  }

  const addresses = listAddresses(user.id);

  return (
    <>
      <Link href="/shop/cart" style={{ fontWeight: 700, fontSize: 14 }}>
        ← カートにもどる
      </Link>
      <div className="sec-h" style={{ marginTop: 10 }}>注文の確認</div>

      {error && <div className="error-box">{error}</div>}
      {view.hasProblem && (
        <div className="error-box">
          カートに問題のある商品があります。このまま確定するとエラーになります。
          <Link href="/shop/cart" style={{ fontWeight: 800, marginLeft: 6 }}>
            カートを直す →
          </Link>
        </div>
      )}

      <form action={placeOrderAction}>
        <div className="sec-h">1. 配送先を選ぶ</div>
        <div className="card">
          {addresses.map((a, i) => (
            <label
              key={a.id}
              className="row"
              style={{ padding: "9px 0", cursor: "pointer", alignItems: "flex-start" }}
            >
              <input
                type="radio"
                name="addressId"
                value={a.id}
                defaultChecked={i === 0}
                style={{ width: 20, height: 20, marginTop: 3, flex: "none" }}
              />
              <span className="grow">
                <span style={{ display: "block", fontWeight: 800 }}>{a.label}</span>
                <span className="muted">{a.address}</span>
              </span>
            </label>
          ))}
          <label
            className="row"
            style={{
              padding: "9px 0",
              cursor: "pointer",
              borderTop: addresses.length > 0 ? "1px solid var(--border)" : undefined,
            }}
          >
            <input
              type="radio"
              name="addressId"
              value="new"
              defaultChecked={addresses.length === 0}
              style={{ width: 20, height: 20, flex: "none" }}
            />
            <span style={{ fontWeight: 800 }}>新しい配送先に届ける</span>
          </label>
          <div className="field" style={{ marginTop: 6 }}>
            <label>配送先の名前（例：店舗・工場）</label>
            <input className="input" name="newLabel" placeholder="店舗" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>住所</label>
            <input className="input" name="newAddress" placeholder="札幌市中央区…" />
          </div>
        </div>

        <div className="sec-h">2. ご注文内容</div>
        <div className="card">
          {view.rows.map(
            (r) =>
              r.product && (
                <div className="total-row" key={r.line.productId}>
                  <span style={{ paddingRight: 10 }}>
                    {r.product.title} × {r.line.qty}
                  </span>
                  <span style={{ flex: "none", fontWeight: 700 }}>
                    {yen(r.product.sale_price * r.line.qty)}
                  </span>
                </div>
              )
          )}
          <div className="total-row" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
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
            <span>お支払い合計（税込）</span>
            <span>{yen(view.grandTotal)}</span>
          </div>
        </div>

        <div className="sec-h">3. お支払い（クレジットカード）</div>
        <div className="card">
          <div className="demo-note" style={{ marginTop: 0 }}>
            デモ決済です。本番はStripeに置き換わります。実際の請求は発生しません。
          </div>
          <div className="field">
            <label>カード番号</label>
            <input
              className="input"
              name="cardNumber"
              inputMode="numeric"
              autoComplete="off"
              placeholder="4242 4242 4242 4242"
            />
          </div>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="field grow" style={{ marginBottom: 0 }}>
              <label>有効期限</label>
              <input className="input" name="cardExp" autoComplete="off" placeholder="12/28" />
            </div>
            <div className="field grow" style={{ marginBottom: 0 }}>
              <label>セキュリティコード</label>
              <input
                className="input"
                name="cardCvc"
                inputMode="numeric"
                autoComplete="off"
                placeholder="123"
              />
            </div>
          </div>
        </div>

        <button className="btn btn-warm btn-xl btn-block" type="submit" style={{ marginTop: 16 }}>
          {yen(view.grandTotal)} を支払って注文を確定する
        </button>
        <p className="muted" style={{ textAlign: "center", marginTop: 10 }}>
          確定と同時に在庫が引き当てられます。売り切れの場合はエラーが表示されます。
        </p>
      </form>
    </>
  );
}
