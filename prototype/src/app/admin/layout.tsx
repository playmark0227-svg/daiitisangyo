import { requireUser } from "@/lib/session";
import { getSettings, unreadCount } from "@/lib/domain";
import { logout } from "@/actions/auth";
import AdminNav from "./nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  const settings = getSettings();
  const unread = unreadCount(user.id);
  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="as-brand">
          {settings.service_name}
          <small>ADMIN CONSOLE</small>
        </div>
        <AdminNav unread={unread} />
        <div className="as-foot">
          <div style={{ fontWeight: 700 }}>{user.org}</div>
          <div>{user.name} さんでログイン中</div>
          <form action={logout} style={{ marginTop: 10 }}>
            <button className="btn btn-ghost btn-sm" type="submit">
              ログアウト
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
