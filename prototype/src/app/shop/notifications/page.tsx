import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listNotifications, markAllRead } from "@/lib/domain";

export default async function NotificationsPage() {
  const user = await requireUser("buyer");
  const notifs = listNotifications(user.id);
  // 開いたら既読にする（一覧の未読表示は取得済みのデータで描画）
  markAllRead(user.id);

  return (
    <>
      <div className="sec-h" style={{ marginTop: 4 }}>
        お知らせ<span className="sec-sub">開くと既読になります</span>
      </div>

      {notifs.length === 0 ? (
        <p className="muted" style={{ textAlign: "center", padding: "34px 0" }}>
          お知らせはまだありません。
        </p>
      ) : (
        <div className="card" style={{ padding: "4px 14px" }}>
          {notifs.map((n) => {
            const body = (
              <>
                <span style={{ flex: "none", fontSize: 17 }}>
                  {n.type === "shipped"
                    ? "🚚"
                    : n.type === "refunded"
                      ? "↩️"
                      : n.type === "new_product"
                        ? "🐟"
                        : "🔔"}
                </span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span style={{ display: "block", lineHeight: 1.55 }}>{n.message}</span>
                  <span className="n-time">{n.created_at.slice(0, 16)}</span>
                </span>
                {n.link && <span style={{ color: "var(--accent)", fontWeight: 800 }}>→</span>}
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
