import { db } from "@/lib/db";
import { getSettings } from "@/lib/domain";
import { loginAs, registerWithInvite } from "@/actions/auth";
import Icon, { type IconName } from "@/components/Icon";
import type { User } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  admin: "管理者",
  seller: "出品者（生産者）",
  buyer: "発注者",
};
const ROLE_ICON: Record<string, IconName> = { admin: "settings", seller: "tag", buyer: "store" };

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
        <div style={{ padding: "26px 2px 12px", borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
          <div className="muted" style={{ fontWeight: 700, letterSpacing: "0.04em", color: "var(--primary)" }}>
            北海道 一次産業 受発注システム
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 0" }}>
            {settings.service_name}
          </h1>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            農業・漁業の生産物を、飲食店・小売・加工事業者へ直接届ける受発注の窓口です。
          </p>
        </div>

        <div className="demo-note">
          本システムは試験運用（デモ環境）です。下の一覧から利用者を選んでログインしてください。
        </div>

        {error === "invite" && (
          <div className="error-box">招待コードが確認できませんでした。コードをお確かめください。</div>
        )}
        {error === "missing" && <div className="error-box">お名前と招待コードを入力してください。</div>}

        <div className="sec-h">利用者を選んでログイン</div>
        <div className="list">
          {users.map((u) => (
            <form key={u.id} action={loginAs}>
              <input type="hidden" name="userId" value={u.id} />
              <button
                className="card row"
                style={{ width: "100%", cursor: "pointer", textAlign: "left", padding: 13 }}
                type="submit"
              >
                <span
                  className="grow"
                  style={{ display: "flex", alignItems: "center", gap: 11 }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 38, height: 38, flex: "none", borderRadius: 4,
                      background: "var(--primary-soft)", color: "var(--primary)",
                      display: "grid", placeItems: "center",
                    }}
                  >
                    <Icon name={ROLE_ICON[u.role]} size={21} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 700 }}>{u.org}</span>
                    <span className="muted">
                      {ROLE_LABEL[u.role]}／{u.name}
                    </span>
                  </span>
                </span>
                <Icon name="arrow-right" size={18} className="" />
              </button>
            </form>
          ))}
        </div>

        <div className="sec-h" style={{ marginTop: 30 }}>
          招待コードで新規登録
          <span className="sec-sub">試験運用中は招待制（QRコード配布相当）</span>
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
