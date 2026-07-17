import Link from "next/link";
import AppBar from "@/components/seller/AppBar";
import Badges from "@/components/seller/Badges";
import { publishTemplateToday } from "@/actions/seller";
import { getProduct, listSellerProducts } from "@/lib/domain";
import { requireUser } from "@/lib/session";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; created?: string; saved?: string; error?: string }>;
}) {
  const user = await requireUser("seller");
  const sp = await searchParams;
  const templates = listSellerProducts(user.id, { templates: true });
  const donePublished = sp.done ? getProduct(Number(sp.done)) : null;

  return (
    <>
      <AppBar title="いつもの商品から出品" backHref="/sell" />
      <main className="phone-main">
        {donePublished && (
          <div className="ok-box">
            「{donePublished.title}」を売り場に出しました。{" "}
            <Link href={`/sell/p/${donePublished.id}/edit`}>確認・編集する</Link>
          </div>
        )}
        {sp.created === "1" && <div className="ok-box">新しい定期商品をつくりました。</div>}
        {sp.saved === "1" && <div className="ok-box">定期商品を保存しました。</div>}
        {sp.error === "notfound" && (
          <div className="error-box">定期商品が見つかりませんでした。</div>
        )}

        <p className="muted" style={{ margin: "2px 0 12px" }}>
          いつも売っている商品を登録しておくと、毎日は「きょうの数量」を入れるだけで出品できます。
        </p>

        {templates.length === 0 ? (
          <div className="card" style={{ textAlign: "center", color: "var(--ink-soft)" }}>
            定期商品はまだありません。
            <br />
            下のボタンからつくれます。
          </div>
        ) : (
          <div className="list">
            {templates.map((t) => (
              <div className="card" key={t.id} style={{ padding: 14 }}>
                <div className="row">
                  <img
                    src={t.photo || "/img/hokke.svg"}
                    alt={t.title}
                    style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover" }}
                  />
                  <div className="grow">
                    <Badges badges={t.badges} temp={t.temp_zone} />
                    <div style={{ fontWeight: 800, lineHeight: 1.4 }}>{t.title}</div>
                    <div className="muted">
                      売り場価格 {t.sale_price.toLocaleString("ja-JP")}円 ・ あなたの受取{" "}
                      {t.cost_price.toLocaleString("ja-JP")}円
                    </div>
                  </div>
                  <Link className="btn btn-ghost btn-sm" href={`/sell/p/${t.id}/edit`}>
                    編集
                  </Link>
                </div>
                <form action={publishTemplateToday} className="row" style={{ marginTop: 12 }}>
                  <input type="hidden" name="template_id" value={t.id} />
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-soft)" }}>
                    きょうの数量
                  </label>
                  <input
                    className="input"
                    name="qty"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    defaultValue={t.stock > 0 ? t.stock : 1}
                    style={{ width: 86, textAlign: "center", fontWeight: 800 }}
                  />
                  <button className="btn btn-warm" style={{ flex: 1 }} type="submit">
                    きょうの分を出品
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/sell/templates/new"
          className="btn btn-ghost btn-block"
          style={{ marginTop: 16 }}
        >
          ＋ 新しい定期商品をつくる
        </Link>
      </main>
    </>
  );
}
