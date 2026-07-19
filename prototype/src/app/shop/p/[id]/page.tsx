import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getProduct, isPastDeadline } from "@/lib/domain";
import { TEMP_LABEL, type TempZone } from "@/lib/types";
import { addToCart } from "@/actions/buyer";
import { yen } from "@/lib/format";
import Badges from "@/components/Badges";
import Icon from "@/components/Icon";
import { DeadlineChip, photoSrc } from "@/components/buyer/parts";

const ERROR_TEXT: Record<string, string> = {
  soldout: "申し訳ありません。この商品は売り切れました。",
  deadline: "申し訳ありません。本日の注文締切を過ぎたため、カートに入れられませんでした。",
};

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; error?: string }>;
}) {
  await requireUser("buyer");
  const { id } = await params;
  const { added, error } = await searchParams;
  const p = getProduct(Number(id));

  if (!p || !p.is_public || p.is_template) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 800, margin: "6px 0" }}>この商品は現在取り扱っていません。</p>
        <Link href="/shop" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
          売り場にもどる
        </Link>
      </div>
    );
  }

  const soldout = p.stock === 0;
  const past = isPastDeadline(p.deadline_time);
  const canBuy = !soldout && !past;
  const maxQty = Math.min(p.stock, 30);

  return (
    <>
      <Link href="/shop" style={{ fontWeight: 700, fontSize: 14 }}>
        ← 売り場にもどる
      </Link>

      {added === "1" && (
        <div className="ok-box" style={{ marginTop: 10 }}>
          カートに入れました。
          <Link
            href="/shop/cart"
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 10, verticalAlign: "middle" }}
          >
            カートへ進む →
          </Link>
        </div>
      )}
      {error && (
        <div className="error-box" style={{ marginTop: 10 }}>
          {ERROR_TEXT[error] ?? "エラーが発生しました。もう一度お試しください。"}
        </div>
      )}

      <img
        src={photoSrc(p.photo, p.category_name)}
        alt={p.title}
        style={{
          width: "100%",
          height: 230,
          objectFit: "cover",
          borderRadius: 14,
          marginTop: 12,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      />

      <div style={{ marginTop: 12 }}>
        <Badges badges={p.badges} temp={p.temp_zone} />
      </div>
      <h1 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.5, margin: "6px 0 2px" }}>
        {p.title}
      </h1>
      <div className="muted">{p.seller_name}</div>
      <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 2px" }}>
        {yen(p.sale_price)}
        <small style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-faint)" }}>（税込）</small>
      </div>
      <div style={{ marginBottom: 12 }}>
        <DeadlineChip deadline={p.deadline_time} stock={p.stock} />
      </div>

      <div className="card">
        <div className="total-row">
          <span className="muted">在庫</span>
          <span style={{ fontWeight: 700 }}>
            {soldout ? <span className="soldout">売り切れ</span> : `残り${p.stock}点`}
          </span>
        </div>
        <div className="total-row">
          <span className="muted">当日発送の締切</span>
          <span style={{ fontWeight: 700 }}>毎日 {p.deadline_time} まで</span>
        </div>
        <div className="total-row">
          <span className="muted">送料</span>
          <span style={{ fontWeight: 700 }}>
            {p.shipping_fee === 0 ? "無料" : yen(p.shipping_fee)}
            <small style={{ fontWeight: 600, color: "var(--ink-faint)" }}>（出品者ごとに1回）</small>
          </span>
        </div>
        <div className="total-row">
          <span className="muted">お届け温度帯</span>
          <span className="badge badge-temp">{TEMP_LABEL[p.temp_zone as TempZone]}便</span>
        </div>
      </div>

      {p.description && (
        <>
          <div className="sec-h">商品の説明</div>
          <div className="card" style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{p.description}</div>
        </>
      )}

      <div className="sec-h">ご注文</div>
      {canBuy ? (
        <form action={addToCart} className="card">
          <input type="hidden" name="productId" value={p.id} />
          <div className="field">
            <label htmlFor="qty">数量（残り{p.stock}点まで）</label>
            <select id="qty" className="input" name="qty" defaultValue="1">
              {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-warm btn-xl btn-block" type="submit">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="cart" size={20} />
              カートに入れる
            </span>
          </button>
        </form>
      ) : (
        <div className="card">
          <div className="error-box" style={{ marginBottom: 10 }}>
            {soldout
              ? "本日分は売り切れました。また明日の出品をお待ちください。"
              : `本日の注文締切（${p.deadline_time}）を過ぎました。明日の出品をお待ちください。`}
          </div>
          <button className="btn btn-warm btn-xl btn-block" type="button" disabled>
            {soldout ? "売り切れ" : "本日分は締切済み"}
          </button>
        </div>
      )}
    </>
  );
}
