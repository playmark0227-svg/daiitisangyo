"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";

const TABS: { href: string; ico: IconName; label: string }[] = [
  { href: "/sell", ico: "tag", label: "出品" },
  { href: "/sell/orders", ico: "clipboard", label: "受注" },
  { href: "/sell/account", ico: "user", label: "登録情報" },
];

export default function TabBar() {
  const path = usePathname() ?? "";
  const isActive = (href: string) =>
    href === "/sell"
      ? !path.startsWith("/sell/orders") &&
        !path.startsWith("/sell/account") &&
        !path.startsWith("/sell/notifications")
      : path.startsWith(href);

  return (
    <nav className="tabbar" aria-label="メインメニュー">
      {TABS.map((t) => {
        const active = isActive(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={active ? "active" : ""}
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
