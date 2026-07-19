import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getOrder } from "@/lib/domain";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { formatDateTime, yen } from "@/lib/format";
import { photoSrc } from "@/components/buyer/parts";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const user = await requireUser("buyer");
  const { id } = await params;
  const { done } = await searchParams;
  const order = getOrder(Number(id));

  if (!order || order.buyer_id !== user.id) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 800, margin: "6px 0" }}>ご注文が見つかりません。</p>
        <Link href="/shop/orders" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
          注文履歴にもどる
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/shop/orders" style={{ fontWeight: 700, fontSize: 14 }}>
        ← 注文履歴にもどる
      </Link>

      {done === "1" && (
        <div className="ok-box" style={{ marginTop: 10 }}>
          ご注文ありがとうございます。ご注文を受け付けました。出品者が発送するとお知らせが届きます。
        </div>
      )}

      {order.status === "refunded" && (
        <div className="error-box" style={{ marginTop: 10 }}>
          この注文は欠品のためキャンセルとなり、全額（{yen(order.grand_total)}）を返金しました。
          ご迷惑をおかけして申し訳ありません。（デモのため実際の返金は発生しません）
        </div>
      )}
      {order.status === "cancel_requested" && (
        <div className="demo-note" style={{ marginTop: 10 }}>
          出品者から欠品キャンセルの申請が届いています。運営が確認中です。確定するとお知らせが届きます。
        </div>
      )}

      <div className="sec-h" style={{ marginTop: 12 }}>
        注文 #{order.id}
        <span className="sec-sub">{formatDateTime(order.created_at)}</span>
        <span className={`pill pill-${order.status}`} style={{ marginLeft: "auto" }}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="card">
        {order.items.map((it) => (
          <div key={it.id} className="row" style={{ padding: "7px 0", alignItems: "flex-start" }}>
            <img
              src={photoSrc(it.photo)}
              alt={it.title}
              style={{
                width: 48,
                height: 48,
                objectFit: "cover",
                borderRadius: 8,
                background: "var(--surface-2)",
                flex: "none",
              }}
            />
            <span className="grow">
              <span style={{ display: "block", fontWeight: 800, fontSize: 13.5, lineHeight: 1.45 }}>
                {it.title}
              </span>
              <span className="muted">
                {it.seller_name}・{yen(it.unit_price)} × {it.qty}点
              </span>
            </span>
            <span style={{ fontWeight: 800, flex: "none" }}>{yen(it.unit_price * it.qty)}</span>
          </div>
        ))}
        <div className="total-row" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <span>商品合計</span>
          <span>{yen(order.items_total)}</span>
        </div>
        <div className="total-row">
          <span>送料</span>
          <span>{yen(order.shipping_total)}</span>
        </div>
        <div className="total-row grand">
          <span>合計（税込）</span>
          <span>{yen(order.grand_total)}</span>
        </div>
      </div>

      <div className="sec-h">配送先</div>
      <div className="card">
        <div style={{ fontWeight: 800 }}>{order.address_label}</div>
        <div className="muted">{order.address}</div>
      </div>

      <Link href="/shop" className="btn btn-ghost btn-block" style={{ marginTop: 16 }}>
        買い物を続ける
      </Link>
    </>
  );
}
