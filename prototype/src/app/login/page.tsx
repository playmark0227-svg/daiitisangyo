import { db } from "@/lib/db";
import { getSettings } from "@/lib/domain";
import { loginAs, registerWithInvite } from "@/actions/auth";
import type { User } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  admin: "管理者",
  seller: "出品者（生産者）",
  buyer: "発注者",
};
const ROLE_ICON: Record<string, string> = { admin: "🛠", seller: "🐟", buyer: "🏬" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const settings = getSettings();
  const users = db()
    .prepare("SELECT * FROM users WHERE active = 1 ORDER BY CASE role WHEN 'buyer' THEN 0 WHEN 'seller' THEN 1 ELSE 2 END, id")
    .all() as unknown as User[];

  return (
    <div className="phone">
      <main className="phone-main" style={{ paddingBottom: 40 }}>
        <div style={{ textAlign: "center", padding: "34px 0 10px" }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 20, margin: "0 auto 12px",
              background: "linear-gradient(150deg, var(--accent), var(--accent-2))",
              display: "grid", placeItems: "center", fontSize: 30,
            }}
          >
            🐟
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
            {settings.service_name}
          </h1>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            北海道の海と大地を、お店へ直送する受発注アプリ
          </p>
        </div>

        <div className="demo-note">
          プロトタイプ（デモ環境）です。下のデモアカウントを選ぶだけでログインできます。
        </div>

        {error === "invite" && (
          <div className="error-box">招待コードが確認できませんでした。コードをお確かめください。</div>
        )}
        {error === "missing" && <div className="error-box">お名前と招待コードを入力してください。</div>}

        <div className="sec-h">デモアカウントでログイン</div>
        <div className="list">
          {users.map((u) => (
            <form key={u.id} action={loginAs}>
              <input type="hidden" name="userId" value={u.id} />
              <button
                className="card row"
                style={{ width: "100%", cursor: "pointer", textAlign: "left", padding: 14 }}
                type="submit"
              >
                <span style={{ fontSize: 26 }}>{ROLE_ICON[u.role]}</span>
                <span className="grow">
                  <span style={{ display: "block", fontWeight: 800 }}>{u.org}</span>
                  <span className="muted">
                    {ROLE_LABEL[u.role]}・{u.name}
                  </span>
                </span>
                <span style={{ color: "var(--accent)", fontWeight: 800 }}>→</span>
              </button>
            </form>
          ))}
        </div>

        <div className="sec-h" style={{ marginTop: 30 }}>
          招待コードで新規登録
          <span className="sec-sub">クローズドβ（QRコード配布相当）</span>
        </div>
        <form action={registerWithInvite} className="card">
          <div className="field">
            <label htmlFor="reg-code">招待コード</label>
            <input id="reg-code" className="input" name="code" placeholder="例: UMI-2026（発注者） / SATO-2026（出品者）" />
          </div>
          <div className="field">
            <label htmlFor="reg-name">お名前</label>
            <input id="reg-name" className="input" name="name" placeholder="山田 太郎" />
          </div>
          <div className="field">
            <label htmlFor="reg-org">屋号・会社名</label>
            <input id="reg-org" className="input" name="org" placeholder="山田水産" />
          </div>
          <div className="field">
            <label htmlFor="reg-phone">電話番号</label>
            <input id="reg-phone" className="input" name="phone" inputMode="tel" placeholder="090-0000-0000" />
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            登録してはじめる
          </button>
        </form>

        <p className="muted" style={{ textAlign: "center", marginTop: 24 }}>
          決済はデモ（モック）です。実際の請求は発生しません。
        </p>
      </main>
    </div>
  );
}
