import { redirect } from "next/navigation";
import AppBar from "@/components/seller/AppBar";
import { requestOrderCancel, shipOrder } from "@/actions/seller";
import { getOrder } from "@/lib/domain";
import { formatDateTime, yen } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { ORDER_STATUS_LABEL, TEMP_LABEL } from "@/lib/types";

export default async function SellerOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ shipped?: string; cancel?: string; error?: string }>;
}) {
  const user = await requireUser("seller");
  const { id } = await params;
  const sp = await searchParams;
  const order = getOrder(Number(id));
  if (!order) redirect("/sell/orders");
  const myItems = order.items.filter((i) => i.seller_id === user.id);
  if (myItems.length === 0) redirect("/sell/orders");

  const myTotal = myItems.reduce((a, i) => a + i.qty * i.unit_price, 0);
  const myIncome = myItems.reduce((a, i) => a + i.qty * i.unit_cost, 0);

  return (
    <>
      <AppBar title={`注文 #${order.id}`} backHref="/sell/orders" />
      <main className="phone-main">
        {sp.shipped === "1" && (
          <div className="ok-box">発送を記録しました。お店にお知らせが届きました。</div>
        )}
        {sp.cancel === "1" && (
          <div className="ok-box">欠品の連絡を送りました。運営の確認をお待ちください。</div>
        )}
        {sp.error === "reason" && (
          <div className="error-box">欠品の理由を入れてください。</div>
        )}

        <div className="row" style={{ marginBottom: 12 }}>
          <span className={`pill pill-${order.status}`}>{ORDER_STATUS_LABEL[order.status]}</span>
          <span className="muted">{formatDateTime(order.created_at)}</span>
        </div>

        <div className="sec-h" style={{ marginTop: 0 }}>
          送る品物
        </div>
        <div className="list">
          {myItems.map((it) => (
            <div className="card" key={it.id}>
              <div className="row">
                <img
                  src={it.photo || "/img/hokke.svg"}
                  alt={it.title}
                  style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover" }}
                />
                <div className="grow">
                  <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.4 }}>
                    {it.title}
                  </div>
                  <span
                    className="badge badge-temp"
                    style={{ fontSize: 14, padding: "2px 10px" }}
                  >
                    {TEMP_LABEL[it.temp_zone]}
                  </span>
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, whiteSpace: "nowrap" }}>
                  ×{it.qty}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sec-h">届け先（送り状にこのまま書いてください）</div>
        <div className="card" style={{ background: "var(--accent-soft)" }}>
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.5 }}>
            {order.buyer_org}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-soft)", margin: "2px 0 6px" }}>
            {order.address_label}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.7 }}>{order.address}</div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="total-row">
            <span>お店の支払い分（あなたの品物）</span>
            <b>{yen(myTotal)}</b>
          </div>
          <div className="total-row">
            <span>あなたの受取</span>
            <b>{yen(myIncome)}</b>
          </div>
        </div>

        {order.status === "paid" && (
          <>
            <form action={shipOrder} style={{ marginTop: 18 }}>
              <input type="hidden" name="order_id" value={order.id} />
              <button className="btn btn-primary btn-xl btn-block" type="submit">
                📦 発送しました
              </button>
            </form>

            <div className="sec-h">品物が用意できないとき</div>
            <form action={requestOrderCancel} className="card">
              <input type="hidden" name="order_id" value={order.id} />
              <div className="field" style={{ marginBottom: 10 }}>
                <label>欠品の理由</label>
                <input
                  className="input"
                  name="reason"
                  placeholder="例：時化で水揚げがありませんでした"
                />
              </div>
              <button className="btn btn-danger btn-block" type="submit">
                品物が用意できない（欠品の連絡をする）
              </button>
              <p className="hint" style={{ marginTop: 8 }}>
                運営が確認してから、お店へ全額返金されます。あなたに支払いは発生しません。
              </p>
            </form>
          </>
        )}

        {order.status === "cancel_requested" && (
          <div className="demo-note" style={{ marginTop: 16 }}>
            欠品キャンセルを申請中です。運営の承認をお待ちください。承認されるとお店へ返金されます。
          </div>
        )}

        {order.status === "shipped" && (
          <div className="ok-box" style={{ marginTop: 16 }}>
            この注文は発送済みです。おつかれさまでした。
          </div>
        )}

        {order.status === "refunded" && (
          <div className="error-box" style={{ marginTop: 16 }}>
            この注文は欠品のためキャンセル（返金済み）になりました。
          </div>
        )}
      </main>
    </>
  );
}
