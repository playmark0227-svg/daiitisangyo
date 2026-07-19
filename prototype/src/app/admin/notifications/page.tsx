import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listNotifications, markAllRead } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import Icon from "@/components/Icon";

export default async function AdminNotificationsPage() {
  const user = await requireUser("admin");
  const items = listNotifications(user.id);
  // 一覧を開いた時点で既読にする（未読の太字は取得済みデータで描画する）
  markAllRead(user.id);

  return (
    <>
      <h1 className="admin-h1">お知らせ</h1>
      <p className="muted" style={{ margin: "0 0 14px" }}>
        欠品キャンセル申請など、運営対応が必要なお知らせが届きます。開くと既読になります。
      </p>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--ink-soft)" }}>
          お知らせはまだありません。
        </div>
      ) : (
        <div className="card" style={{ padding: "4px 14px", maxWidth: 640 }}>
          {items.map((n) => {
            const body = (
              <>
                <span
                  style={{
                    flex: "none",
                    marginTop: 1,
                    color: n.type === "cancel_request" ? "var(--danger)" : "var(--ink-soft)",
                  }}
                >
                  <Icon name={n.type === "cancel_request" ? "alert" : "bell"} size={18} />
                </span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span style={{ display: "block", lineHeight: 1.55 }}>{n.message}</span>
                  <span className="n-time">{formatDateTime(n.created_at)}</span>
                </span>
                {n.link && (
                  <span style={{ flex: "none", color: "var(--accent)" }}>
                    <Icon name="arrow-right" size={18} />
                  </span>
                )}
              </>
            );
            const cls = `notif${n.read ? "" : " unread"}`;
            return n.link ? (
              <Link key={n.id} href={n.link} className={cls} style={{ color: "var(--ink)" }}>
                {body}
              </Link>
            ) : (
              <div key={n.id} className={cls}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
