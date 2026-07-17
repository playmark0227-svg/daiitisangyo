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
  { href: "/admin/notices", label: "📣 お知らせ配信" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {MENU.map((m) => {
        const active =
          m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href);
        return (
          <Link key={m.href} href={m.href} className={active ? "active" : undefined}>
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
