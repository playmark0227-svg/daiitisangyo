import Link from "next/link";
import { dashboardStats } from "@/lib/domain";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { yen, formatDateTime } from "@/lib/format";

export default async function AdminDashboardPage() {
  const s = dashboardStats();
  return (
    <>
      <h1 className="admin-h1">ダッシュボード</h1>

      <div className="stats">
        <div className="stat">
          <div className="st-label">本日の売上（税込）</div>
          <div className="st-value">{yen(s.todaySales)}</div>
        </div>
        <div className="stat">
          <div className="st-label">本日の注文</div>
          <div className="st-value">
            {s.todayOrders.toLocaleString("ja-JP")}
            <small> 件</small>
          </div>
        </div>
        <div className="stat">
          <div className="st-label">今月の売上（税込）</div>
          <div className="st-value">{yen(s.monthSales)}</div>
        </div>
        <div className="stat">
          <div className="st-label">今月の注文</div>
          <div className="st-value">
            {s.monthOrders.toLocaleString("ja-JP")}
            <small> 件</small>
          </div>
        </div>
        <div className="stat">
          <div className="st-label">手数料収益（概算・今月）</div>
          <div className="st-value">{yen(s.monthMargin)}</div>
        </div>
        <div className="stat">
          <div className="st-label">公開中の商品数</div>
          <div className="st-value">
            {s.publicProducts.toLocaleString("ja-JP")}
            <small> 点</small>
          </div>
        </div>
      </div>

      <div className="sec-h">
        直近の注文
        <span className="sec-sub">最新8件</span>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>注文ID</th>
              <th>日時</th>
              <th>発注者</th>
              <th className="num">金額（税込）</th>
              <th>ステータス</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {s.recentOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  注文はまだありません。
                </td>
              </tr>
            )}
            {s.recentOrders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{formatDateTime(o.created_at)}</td>
                <td>{o.buyer_org ?? o.buyer_name}</td>
                <td className="num">{yen(o.grand_total)}</td>
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
