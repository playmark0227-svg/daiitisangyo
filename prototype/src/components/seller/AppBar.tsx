import Link from "next/link";
import { unreadCount } from "@/lib/domain";
import { getUser } from "@/lib/session";
import Icon from "@/components/Icon";

/** 出品者アプリ共通ヘッダー（お知らせ・未読件数付き） */
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
          <Icon name="arrow-left" size={16} />
          戻る
        </Link>
      )}
      <div className="ab-title">{title}</div>
      <Link href="/sell/notifications" className="ab-icon" aria-label={`お知らせ${unread > 0 ? `（未読${unread}件）` : ""}`}>
        <Icon name="bell" size={22} />
        {unread > 0 && <span className="ab-badge">{unread}</span>}
      </Link>
    </header>
  );
}
