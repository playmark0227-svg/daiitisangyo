import Link from "next/link";
import AppBar from "@/components/seller/AppBar";
import { listNotifications, markAllRead } from "@/lib/domain";
import { requireUser } from "@/lib/session";

export default async function SellerNotificationsPage() {
  const user = await requireUser("seller");
  const items = listNotifications(user.id);
  // 一覧を開いた時点で既読にする（未読の太字はこの表示までは残す）
  markAllRead(user.id);

  return (
    <>
      <AppBar title="お知らせ" backHref="/sell" />
      <main className="phone-main">
        {items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", color: "var(--ink-soft)" }}>
            お知らせはまだありません。
          </div>
        ) : (
          <div>
            {items.map((n) => (
              <div key={n.id} className={n.read === 0 ? "notif unread" : "notif"}>
                <span className="n-time">{n.created_at.slice(5, 16)}</span>
                <span className="grow">
                  {n.link ? <Link href={n.link}>{n.message}</Link> : n.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
