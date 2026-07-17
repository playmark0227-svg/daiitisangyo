"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/sell", ico: "🐟", label: "出品" },
  { href: "/sell/orders", ico: "📋", label: "受注" },
  { href: "/sell/account", ico: "👤", label: "アカウント" },
] as const;

export default function TabBar() {
  const path = usePathname() ?? "";
  const isActive = (href: string) =>
    href === "/sell"
      ? !path.startsWith("/sell/orders") &&
        !path.startsWith("/sell/account") &&
        !path.startsWith("/sell/notifications")
      : path.startsWith(href);

  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={isActive(t.href) ? "active" : ""}>
          <span className="t-ico">{t.ico}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
