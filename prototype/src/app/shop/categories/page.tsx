import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listCategories, listPublicProducts } from "@/lib/domain";
import { ProductFeed } from "@/components/buyer/parts";
import Icon from "@/components/Icon";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  await requireUser("buyer");
  const { cat } = await searchParams;
  const cats = listCategories();

  // カテゴリ未選択: 大きなボタン一覧
  if (cat === undefined) {
    return (
      <>
        <div className="sec-h" style={{ marginTop: 4 }}>
          カテゴリから探す
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/shop/categories?cat=${c.id}`}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                textAlign: "center",
                padding: "22px 10px",
                marginTop: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                }}
              >
                <Icon name="tag" size={22} />
              </span>
              <span style={{ fontWeight: 800, color: "var(--ink)", fontSize: 15 }}>{c.name}</span>
            </Link>
          ))}
        </div>
        <p className="muted" style={{ textAlign: "center", marginTop: 18 }}>
          ご覧になるカテゴリを選択してください。
        </p>
      </>
    );
  }

  // カテゴリ選択済み: チップで切り替え＋商品一覧
  const catId = Number(cat) || 0;
  const current = cats.find((c) => c.id === catId);
  const products = listPublicProducts(catId > 0 ? catId : undefined);

  return (
    <>
      <div className="chips">
        <Link href="/shop/categories?cat=0" className={`chip${catId === 0 ? " active" : ""}`}>
          すべて
        </Link>
        {cats.map((c) => (
          <Link
            key={c.id}
            href={`/shop/categories?cat=${c.id}`}
            className={`chip${catId === c.id ? " active" : ""}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="sec-h">
        {current ? current.name : "すべての商品"}
        <span className="sec-sub">{products.length}件</span>
      </div>
      <ProductFeed products={products} />
    </>
  );
}
