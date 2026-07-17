import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listCategories, listPublicProducts } from "@/lib/domain";
import { ProductFeed } from "@/components/buyer/parts";

const CAT_ICON: Record<string, string> = {
  鮮魚: "🐟",
  野菜: "🥬",
  果物: "🍈",
  加工品: "🥫",
};

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
              style={{ textAlign: "center", padding: "24px 10px", marginTop: 0 }}
            >
              <span style={{ fontSize: 36, display: "block", lineHeight: 1.3 }}>
                {CAT_ICON[c.name] ?? "🧺"}
              </span>
              <span style={{ fontWeight: 800, color: "var(--ink)", fontSize: 15 }}>{c.name}</span>
            </Link>
          ))}
        </div>
        <p className="muted" style={{ textAlign: "center", marginTop: 18 }}>
          見たいカテゴリを押してください
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
            {CAT_ICON[c.name] ?? "🧺"} {c.name}
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
