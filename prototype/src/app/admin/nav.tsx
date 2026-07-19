"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/admin", label: "📊 ダッシュボード" },
  { href: "/admin/products", label: "🐟 商品管理" },
  { href: "/admin/categories", label: "🗂 カテゴリ" },
  { href: "/admin/orders", label: "📦 注文管理" },
  { href: "/admin/users", label: "👥 ユーザー" },
  { href: "/admin/margin", label: "％ 手数料設定" },
  { href: "/admin/notifications", label: "🔔 お知らせ" },
  { href: "/admin/notices", label: "📣 お知らせ配信" },
];

export default function AdminNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {MENU.map((m) => {
        const active =
          m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href);
        const showBadge = m.href === "/admin/notifications" && unread > 0;
        return (
          <Link
            key={m.href}
            href={m.href}
            className={active ? "active" : undefined}
            style={
              showBadge
                ? { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }
                : undefined
            }
          >
            <span>{m.label}</span>
            {showBadge && (
              <span
                aria-label={`未読 ${unread} 件`}
                style={{
                  flex: "none",
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 999,
                  background: "var(--danger, #d9534f)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
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
