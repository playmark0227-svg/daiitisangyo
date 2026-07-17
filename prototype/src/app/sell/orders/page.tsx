import Link from "next/link";
import AppBar from "@/components/seller/AppBar";
import { listSellerOrders } from "@/lib/domain";
import { requireUser } from "@/lib/session";
import { ORDER_STATUS_LABEL } from "@/lib/types";

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser("seller");
  const { error } = await searchParams;
  const orders = listSellerOrders(user.id);

  return (
    <>
      <AppBar title="受注" />
      <main className="phone-main">
        {error === "notfound" && (
          <div className="error-box">注文が見つかりませんでした。</div>
        )}

        {orders.length === 0 ? (
          <div className="card" style={{ textAlign: "center", color: "var(--ink-soft)" }}>
            まだ注文はありません。
            <br />
            注文が入ると、ここに表示されお知らせも届きます。
          </div>
        ) : (
          <div className="list">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/sell/orders/${o.id}`}
                className="card"
                style={{ display: "block", color: "inherit" }}
              >
                <div className="row">
                  <b>注文 #{o.id}</b>
                  <span className={`pill pill-${o.status}`}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                  <span className="grow" />
                  <span className="muted">{o.created_at.slice(5, 16)}</span>
                </div>
                <div style={{ fontWeight: 800, marginTop: 4 }}>{o.buyer_org}</div>
                <div className="muted">
                  あなたの品物 {o.my_qty}点 ・ {o.my_total.toLocaleString("ja-JP")}円
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
