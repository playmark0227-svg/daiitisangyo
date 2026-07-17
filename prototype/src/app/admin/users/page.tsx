import { listInviteCodes, listUsers } from "@/lib/domain";
import { requireUser } from "@/lib/session";
import { adminSetUserActive } from "@/actions/admin";
import ToggleForm from "../toggle-form";

const ROLE_LABEL: Record<string, string> = {
  admin: "管理者",
  seller: "出品者",
  buyer: "発注者",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const me = await requireUser("admin");
  const users = listUsers();
  const invites = listInviteCodes();

  return (
    <>
      <h1 className="admin-h1">ユーザー管理</h1>

      {error === "self" && (
        <div className="error-box">自分自身のアカウントは停止できません。</div>
      )}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>組織・屋号</th>
              <th>氏名</th>
              <th>ロール</th>
              <th>電話</th>
              <th>状態</th>
              <th>利用停止 / 再開</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td style={{ fontWeight: 700 }}>{u.org}</td>
                <td>{u.name}</td>
                <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                <td>{u.phone}</td>
                <td>
                  {u.active === 1 ? (
                    <span className="pill pill-shipped">利用中</span>
                  ) : (
                    <span className="pill pill-refunded">停止中</span>
                  )}
                </td>
                <td>
                  {u.id === me.id ? (
                    <span className="muted">—（自分）</span>
                  ) : (
                    <ToggleForm
                      action={adminSetUserActive}
                      checked={u.active === 1}
                      hidden={{ id: u.id, next: u.active === 1 ? "0" : "1" }}
                      title={u.active === 1 ? "利用停止にする" : "利用を再開する"}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sec-h">
        招待コード
        <span className="sec-sub">クローズドβの新規登録に使います</span>
      </div>
      <div className="tbl-wrap" style={{ maxWidth: 560 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>コード</th>
              <th>対象ロール</th>
              <th>メモ</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((inv) => (
              <tr key={inv.code}>
                <td style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{inv.code}</td>
                <td>{ROLE_LABEL[inv.role] ?? inv.role}</td>
                <td>{inv.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        QRコード配布用URL: http://localhost:3100/login
        （このURLをQRコード化してチラシ等で配布する想定です）
      </p>
    </>
  );
}
