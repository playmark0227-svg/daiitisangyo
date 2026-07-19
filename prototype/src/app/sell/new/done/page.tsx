import Link from "next/link";
import { redirect } from "next/navigation";
import Badges from "@/components/Badges";
import AppBar from "@/components/seller/AppBar";
import { getProduct } from "@/lib/domain";
import { yen } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function ListingDonePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await requireUser("seller");
  const { id } = await searchParams;
  const product = id ? getProduct(Number(id)) : null;
  if (!product || product.seller_id !== user.id) redirect("/sell");

  return (
    <>
      <AppBar title="出品完了" backHref="/sell" />
      <main className="phone-main">
        <div style={{ textAlign: "center", padding: "26px 0 6px" }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 4px" }}>
            出品されました！
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            お店の売り場に並びました。注文が入るとお知らせします。
          </p>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden", margin: "18px 0" }}>
          <img
            src={product.photo || "/img/hokke.svg"}
            alt={product.title}
            style={{ width: "100%", height: 190, objectFit: "cover" }}
          />
          <div style={{ padding: 16 }}>
            <Badges badges={product.badges} temp={product.temp_zone} />
            <div style={{ fontSize: 19, fontWeight: 800, margin: "6px 0 8px" }}>
              {product.title}
            </div>
            <div className="total-row">
              <span>お店に出る価格（税込）</span>
              <b>{yen(product.sale_price)}</b>
            </div>
            <div className="total-row">
              <span>あなたの受取（1つあたり）</span>
              <b>{yen(product.cost_price)}</b>
            </div>
            <div className="total-row">
              <span>数量</span>
              <b>{product.stock}</b>
            </div>
          </div>
        </div>

        <Link href="/sell/new" className="btn btn-warm btn-xl btn-block">
          続けて出品する
        </Link>
        <Link
          href={`/sell/p/${product.id}/edit`}
          className="btn btn-ghost btn-block"
          style={{ marginTop: 10 }}
        >
          くわしく編集する（説明文・締切など）
        </Link>
        <Link href="/sell" className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>
          ホームへもどる
        </Link>
      </main>
    </>
  );
}
