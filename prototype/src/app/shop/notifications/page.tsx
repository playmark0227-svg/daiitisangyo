import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listNotifications, markAllRead } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import Icon, { type IconName } from "@/components/Icon";

const NOTIF_ICON: Record<string, IconName> = {
  shipped: "truck",
  refunded: "alert",
  new_product: "tag",
};

export default async function NotificationsPage() {
  const user = await requireUser("buyer");
  // 未読太字はこの表示までは残し、開いた時点で既読化する（ヘッダのバッジは次の遷移で消える。出品者側と同じ挙動）。
  const notifs = listNotifications(user.id);
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
                <span style={{ flex: "none", color: "var(--ink-faint)", display: "inline-flex" }}>
                  <Icon name={NOTIF_ICON[n.type] ?? "bell"} size={18} />
                </span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span style={{ display: "block", lineHeight: 1.55 }}>{n.message}</span>
                  <span className="n-time">{formatDateTime(n.created_at)}</span>
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
