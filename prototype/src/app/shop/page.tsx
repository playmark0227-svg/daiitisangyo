import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listNotifications, listPublicProducts } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import { ProductFeed } from "@/components/buyer/parts";

export default async function ShopHomePage() {
  const user = await requireUser("buyer");
  const products = listPublicProducts();
  const latest = listNotifications(user.id, 1)[0];

  return (
    <>
      {latest && (
        <Link
          href="/shop/notifications"
          style={{
            display: "block",
            background: "var(--ok-soft)",
            border: "1px solid color-mix(in srgb, var(--ok) 25%, transparent)",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 14,
            color: "var(--ink)",
          }}
        >
          <span className="row">
            <span style={{ fontSize: 20 }}>🔔</span>
            <span className="grow">
              <span className="muted" style={{ display: "block", fontSize: 11 }}>
                お知らせ・{formatDateTime(latest.created_at)}
              </span>
              <span
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {latest.message}
              </span>
            </span>
            <span style={{ color: "var(--ok)", fontWeight: 800 }}>→</span>
          </span>
        </Link>
      )}

      <div className="sec-h" style={{ marginTop: 4 }}>
        本日の商品
        <span className="sec-sub">{products.length}件・売り場は毎朝入れ替わります</span>
      </div>
      <ProductFeed products={products} />
    </>
  );
}
