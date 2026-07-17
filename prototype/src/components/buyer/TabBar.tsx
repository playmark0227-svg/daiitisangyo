"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/shop", ico: "🏠", label: "ホーム" },
  { href: "/shop/categories", ico: "🗂", label: "カテゴリ" },
  { href: "/shop/orders", ico: "📦", label: "注文履歴" },
  { href: "/shop/account", ico: "👤", label: "アカウント" },
];

export default function TabBar() {
  const pathname = usePathname() ?? "";
  const isActive = (href: string) =>
    href === "/shop"
      ? pathname === "/shop" ||
        pathname.startsWith("/shop/p/") ||
        pathname.startsWith("/shop/cart") ||
        pathname.startsWith("/shop/checkout")
      : pathname.startsWith(href);

  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={isActive(t.href) ? "active" : undefined}>
          <span className="t-ico">{t.ico}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
