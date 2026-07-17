import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getSettings, unreadCount } from "@/lib/domain";
import { readCart } from "@/components/buyer/cart-view";
import TabBar from "@/components/buyer/TabBar";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("buyer");
  const settings = getSettings();
  const unread = unreadCount(user.id);
  const cart = await readCart();
  const cartCount = cart.reduce((a, l) => a + l.qty, 0);

  return (
    <div className="phone">
      <header className="appbar">
        <div className="ab-title">🐟 {settings.service_name}</div>
        <Link href="/shop/cart" className="ab-icon" aria-label="カートを見る">
          🛒
          {cartCount > 0 && <span className="ab-badge">{cartCount}</span>}
        </Link>
        <Link href="/shop/notifications" className="ab-icon" aria-label="お知らせを見る">
          🔔
          {unread > 0 && <span className="ab-badge">{unread}</span>}
        </Link>
      </header>
      <main className="phone-main">{children}</main>
      <TabBar />
    </div>
  );
}
