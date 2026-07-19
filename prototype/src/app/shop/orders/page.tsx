import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listBuyerOrders } from "@/lib/domain";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { formatDateTime, yen } from "@/lib/format";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const user = await requireUser("buyer");
  const { done } = await searchParams;
  const orders = listBuyerOrders(user.id);
  const doneCount = Number(done);

  return (
    <>
      {Number.isFinite(doneCount) && doneCount > 0 && (
        <div className="ok-box">
          ご注文ありがとうございます。出品者ごとに{doneCount}件のご注文を受け付けました。出品者が発送するとお知らせが届きます。
        </div>
      )}
      <div className="sec-h" style={{ marginTop: 4 }}>
        注文履歴<span className="sec-sub">{orders.length}件</span>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "30px 16px" }}>
          <p style={{ fontWeight: 800, margin: "6px 0" }}>まだ注文はありません</p>
          <Link href="/shop" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
            本日の商品を見る
          </Link>
        </div>
      ) : (
        <div>
          {orders.map((o) => (
            <Link key={o.id} href={`/shop/orders/${o.id}`} className="card row" style={{ display: "flex" }}>
              <span className="grow">
                <span style={{ display: "block", fontWeight: 800, color: "var(--ink)" }}>
                  注文 #{o.id}
                </span>
                <span className="muted">{formatDateTime(o.created_at)}</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontWeight: 800, color: "var(--ink)" }}>
                  {yen(o.grand_total)}
                </span>
                <span className={`pill pill-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
