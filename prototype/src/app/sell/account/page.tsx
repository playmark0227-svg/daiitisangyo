import AppBar from "@/components/seller/AppBar";
import { logout } from "@/actions/auth";
import { sellerMonthlyStats } from "@/actions/seller";
import { requireUser } from "@/lib/session";

export default async function SellerAccountPage() {
  const user = await requireUser("seller");
  const stats = await sellerMonthlyStats();

  return (
    <>
      <AppBar title="アカウント" />
      <main className="phone-main">
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🐟</div>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{user.org}</div>
          <div className="muted">出品者（生産者）・{user.name}</div>
          <div className="muted">{user.phone}</div>
        </div>

        <div className="sec-h">
          今月の売上
          <span className="sec-sub">返金になった注文は含みません</span>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="st-label">受注件数</div>
            <div className="st-value">
              {stats.orders.toLocaleString("ja-JP")}
              <small> 件</small>
            </div>
          </div>
          <div className="stat">
            <div className="st-label">売上額（お店の支払い分）</div>
            <div className="st-value">
              {stats.sales.toLocaleString("ja-JP")}
              <small> 円</small>
            </div>
          </div>
          <div className="stat">
            <div className="st-label">あなたの受取額</div>
            <div className="st-value">
              {stats.income.toLocaleString("ja-JP")}
              <small> 円</small>
            </div>
          </div>
        </div>
        <p className="hint" style={{ marginTop: -8 }}>
          受取額は、手数料を除いたお渡し金額の合計です。
        </p>

        <div className="demo-note">
          プロトタイプのため、実際の入金・振込は行われません。
        </div>

        <form action={logout} style={{ marginTop: 20 }}>
          <button className="btn btn-ghost btn-block" type="submit">
            ログアウト
          </button>
        </form>
      </main>
    </>
  );
}
