"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";

const TABS: { href: string; ico: IconName; label: string }[] = [
  { href: "/shop", ico: "home", label: "ホーム" },
  { href: "/shop/categories", ico: "grid", label: "商品分類" },
  { href: "/shop/orders", ico: "box", label: "注文履歴" },
  { href: "/shop/account", ico: "user", label: "利用者情報" },
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
    <nav className="tabbar" aria-label="メインメニュー">
      {TABS.map((t) => {
        const active = isActive(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={t.ico} size={22} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
