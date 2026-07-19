import Link from "next/link";
import { listAllOrdersWithCounts } from "@/lib/domain";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { yen, formatDateTime } from "@/lib/format";

export default async function AdminOrdersPage() {
  const orders = listAllOrdersWithCounts();

  return (
    <>
      <div className="row" style={{ marginBottom: 18 }}>
        <h1 className="admin-h1" style={{ margin: 0 }}>
          注文管理
        </h1>
        <span className="grow" />
        <a className="btn btn-ghost btn-sm" href="/api/csv">
          取引明細CSVダウンロード
        </a>
      </div>
      <p className="muted" style={{ margin: "0 0 14px" }}>
        CSVは税率区分（軽減税率8%）付きの取引明細です。経理・会計ソフトへの取り込みにお使いください。
      </p>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>注文ID</th>
              <th>日時</th>
              <th>発注者</th>
              <th className="num">商品数</th>
              <th className="num">合計（税込）</th>
              <th>ステータス</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  注文はまだありません。
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{formatDateTime(o.created_at)}</td>
                <td>{o.buyer_org ?? o.buyer_name}</td>
                <td className="num">{o.item_count} 点</td>
                <td className="num" style={{ fontWeight: 700 }}>
                  {yen(o.grand_total)}
                </td>
                <td>
                  <span className={`pill pill-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span>
                </td>
                <td>
                  <Link href={`/admin/orders/${o.id}`}>詳細</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
