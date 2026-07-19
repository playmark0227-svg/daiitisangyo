import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/domain";
import { ORDER_STATUS_LABEL, TEMP_LABEL, type OrderItem, type TempZone } from "@/lib/types";
import { yen, formatDateTime } from "@/lib/format";
import RefundForm from "../refund-form";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ refunded?: string }>;
}) {
  const { id } = await params;
  const { refunded } = await searchParams;
  const order = getOrder(Number(id));
  if (!order) notFound();

  // 出品者ごとに明細をまとめる
  const bySeller = new Map<string, OrderItem[]>();
  for (const it of order.items) {
    const key = it.seller_name ?? `出品者#${it.seller_id}`;
    const arr = bySeller.get(key) ?? [];
    arr.push(it);
    bySeller.set(key, arr);
  }

  return (
    <>
      <h1 className="admin-h1">
        注文詳細 <span className="muted">#{order.id}</span>{" "}
        <span className={`pill pill-${order.status}`} style={{ verticalAlign: "middle" }}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </h1>
      <p style={{ margin: "0 0 14px" }}>
        <Link href="/admin/orders">← 注文一覧へ戻る</Link>
      </p>

      {refunded === "1" && (
        <div className="ok-box">
          返金処理が完了しました（デモ決済）。在庫は元に戻り、発注者に通知しました。
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
        <div>
          <div className="sec-h" style={{ marginTop: 0 }}>
            注文明細
            <span className="sec-sub">出品者ごとに梱包・発送されます</span>
          </div>
          {[...bySeller.entries()].map(([seller, items]) => (
            <div key={seller} className="card">
              <div style={{ fontWeight: 800, marginBottom: 8 }}>🐟 {seller}</div>
              {items.map((it) => (
                <div key={it.id} className="row" style={{ padding: "6px 0" }}>
                  {it.photo ? (
                    <img
                      src={it.photo}
                      alt=""
                      width={40}
                      height={40}
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                    />
                  ) : (
                    <span style={{ display: "inline-block", width: 40, height: 40, borderRadius: 8, background: "var(--surface-2)" }} />
                  )}
                  <span className="grow">
                    <span style={{ display: "block", fontWeight: 700, fontSize: 13.5 }}>{it.title}</span>
                    <span className="muted">
                      <span className="badge badge-temp">{TEMP_LABEL[it.temp_zone as TempZone]}</span>{" "}
                      {yen(it.unit_price)} × {it.qty}
                    </span>
                  </span>
                  <span style={{ fontWeight: 800 }}>{yen(it.unit_price * it.qty)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div>
          <div className="card">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>発注者</div>
            <div>{order.buyer_org}</div>
            <div className="muted">{order.buyer_name} さん</div>
            <div style={{ fontWeight: 800, margin: "14px 0 6px" }}>配送先</div>
            <div className="muted">{order.address_label}</div>
            <div>{order.address}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              注文日時: {formatDateTime(order.created_at)}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>金額内訳</div>
            <div className="total-row">
              <span>商品合計（税込）</span>
              <span>{yen(order.items_total)}</span>
            </div>
            <div className="total-row">
              <span>送料</span>
              <span>{yen(order.shipping_total)}</span>
            </div>
            <div className="total-row grand">
              <span>合計</span>
              <span>{yen(order.grand_total)}</span>
            </div>
          </div>

          {order.status === "cancel_requested" && (
            <div className="card">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>欠品キャンセル申請が届いています</div>
              <p className="muted" style={{ margin: "0 0 10px" }}>
                承認すると全額返金（デモ）となり、在庫が元に戻り、発注者に通知されます。
              </p>
              <RefundForm
                orderId={order.id}
                label="キャンセルを承認して返金する"
                confirmText={`注文 #${order.id} を全額返金します。よろしいですか？`}
                className="btn btn-danger btn-block"
              />
            </div>
          )}

          {(order.status === "paid" || order.status === "shipped") && (
            <div className="card">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>トラブル対応</div>
              <p className="muted" style={{ margin: "0 0 10px" }}>
                品質問題などで運営判断により返金する場合に使います。押すとすぐに全額返金（デモ）と在庫戻しが行われます。
              </p>
              <RefundForm
                orderId={order.id}
                label="強制返金する"
                confirmText={`【確認】注文 #${order.id} を運営判断で全額返金します。この操作は取り消せません。よろしいですか？`}
                className="btn btn-danger btn-block"
              />
            </div>
          )}

          {order.status === "refunded" && (
            <div className="card">
              <div className="muted">この注文は返金済みです。追加の操作はありません。</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
