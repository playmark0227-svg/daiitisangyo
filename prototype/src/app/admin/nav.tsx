"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";

const MENU: { href: string; ico: IconName; label: string }[] = [
  { href: "/admin", ico: "chart", label: "ダッシュボード" },
  { href: "/admin/products", ico: "tag", label: "商品管理" },
  { href: "/admin/categories", ico: "folder", label: "商品分類" },
  { href: "/admin/orders", ico: "box", label: "注文管理" },
  { href: "/admin/users", ico: "users", label: "利用者管理" },
  { href: "/admin/margin", ico: "percent", label: "手数料設定" },
  { href: "/admin/notifications", ico: "bell", label: "お知らせ" },
  { href: "/admin/notices", ico: "megaphone", label: "お知らせ配信" },
];

export default function AdminNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav>
      {MENU.map((m) => {
        const active =
          m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href);
        const showBadge = m.href === "/admin/notifications" && unread > 0;
        return (
          <Link
            key={m.href}
            href={m.href}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={m.ico} size={19} />
            <span className="grow">{m.label}</span>
            {showBadge && (
              <span
                aria-label={`未読 ${unread} 件`}
                style={{
                  flex: "none",
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 999,
                  background: "var(--danger)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
