import { requireUser } from "@/lib/session";
import { listAddresses } from "@/lib/domain";
import { addAddressAction } from "@/actions/buyer";
import { logout } from "@/actions/auth";
import Icon from "@/components/Icon";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const user = await requireUser("buyer");
  const { done, error } = await searchParams;
  const addresses = listAddresses(user.id);

  return (
    <>
      <div className="sec-h" style={{ marginTop: 4 }}>アカウント</div>

      {done === "addr" && <div className="ok-box">配送先を追加しました。</div>}
      {error === "addr" && (
        <div className="error-box">配送先の名前と住所の両方を入力してください。</div>
      )}

      <div className="card row">
        <span
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            flex: "none",
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: "var(--primary-soft)",
            color: "var(--primary)",
          }}
        >
          <Icon name="store" size={24} />
        </span>
        <span className="grow">
          <span style={{ display: "block", fontWeight: 800, fontSize: 15 }}>{user.org}</span>
          <span className="muted">発注者・{user.name}</span>
        </span>
      </div>
      <div className="card">
        <div className="total-row">
          <span className="muted">お名前</span>
          <span style={{ fontWeight: 700 }}>{user.name}</span>
        </div>
        <div className="total-row">
          <span className="muted">屋号・会社名</span>
          <span style={{ fontWeight: 700 }}>{user.org}</span>
        </div>
        <div className="total-row">
          <span className="muted">電話番号</span>
          <span style={{ fontWeight: 700 }}>{user.phone || "未登録"}</span>
        </div>
      </div>

      <div className="sec-h">
        配送先<span className="sec-sub">{addresses.length}件</span>
      </div>
      {addresses.length === 0 ? (
        <p className="muted">配送先はまだ登録されていません。下のフォームから追加できます。</p>
      ) : (
        <div className="card" style={{ padding: "4px 16px" }}>
          {addresses.map((a) => (
            <div key={a.id} className="row" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span aria-hidden="true" style={{ flex: "none", color: "var(--ink-faint)", display: "inline-flex" }}>
                <Icon name="location" size={18} />
              </span>
              <span className="grow">
                <span style={{ display: "block", fontWeight: 800 }}>{a.label}</span>
                <span className="muted">{a.address}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <form action={addAddressAction} className="card" style={{ marginTop: 12 }}>
        <div className="field">
          <label htmlFor="addr-label">配送先の名前（例：店舗・工場）</label>
          <input id="addr-label" className="input" name="label" placeholder="店舗" />
        </div>
        <div className="field">
          <label htmlFor="addr-address">住所</label>
          <input id="addr-address" className="input" name="address" placeholder="札幌市中央区…" />
        </div>
        <button className="btn btn-primary btn-block" type="submit">
          配送先を追加する
        </button>
      </form>

      <div className="sec-h">その他</div>
      <form action={logout}>
        <button className="btn btn-danger btn-block" type="submit">
          ログアウト
        </button>
      </form>
      <p className="muted" style={{ textAlign: "center", marginTop: 14 }}>
        プロトタイプ（デモ環境）です。決済・請求は発生しません。
      </p>
    </>
  );
}
