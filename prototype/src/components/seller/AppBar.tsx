import Link from "next/link";
import { unreadCount } from "@/lib/domain";
import { getUser } from "@/lib/session";

/** 出品者アプリ共通ヘッダー（通知ベル・未読バッジ付き） */
export default async function AppBar({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  const user = await getUser();
  const unread = user ? unreadCount(user.id) : 0;

  return (
    <header className="appbar">
      {backHref && (
        <Link href={backHref} className="ab-back">
          ← もどる
        </Link>
      )}
      <div className="ab-title">{title}</div>
      <Link href="/sell/notifications" className="ab-icon" aria-label="お知らせ">
        🔔
        {unread > 0 && <span className="ab-badge">{unread}</span>}
      </Link>
    </header>
  );
}
