import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getSettings, unreadCount } from "@/lib/domain";
import { buildCartView, readCart } from "@/components/buyer/cart-view";
import TabBar from "@/components/buyer/TabBar";
import Icon from "@/components/Icon";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("buyer");
  const settings = getSettings();
  const unread = unreadCount(user.id);
  const cart = await readCart();
  // 取扱終了・非公開になった行は除外して数える（カート画面の点数と一致させる）
  const cartCount = buildCartView(cart).count;

  return (
    <div className="phone">
      <header className="appbar">
        <div className="ab-title">
          {settings.service_name}
          <small>北海道 一次産業 受発注システム</small>
        </div>
        <Link href="/shop/cart" className="ab-icon" aria-label={`注文カート${cartCount > 0 ? `（${cartCount}点）` : ""}`}>
          <Icon name="cart" size={22} />
          {cartCount > 0 && <span className="ab-badge">{cartCount}</span>}
        </Link>
        <Link href="/shop/notifications" className="ab-icon" aria-label={`お知らせ${unread > 0 ? `（未読${unread}件）` : ""}`}>
          <Icon name="bell" size={22} />
          {unread > 0 && <span className="ab-badge">{unread}</span>}
        </Link>
      </header>
      <main className="phone-main">{children}</main>
      <TabBar />
    </div>
  );
}
