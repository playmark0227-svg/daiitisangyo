import { redirect } from "next/navigation";
import AppBar from "@/components/seller/AppBar";
import { generateAiDescription, saveProduct } from "@/actions/seller";
import { BADGE_OPTIONS, TEMP_ZONES, parseBadges } from "@/lib/catalog";
import { getProduct, getSettings, listCategories } from "@/lib/domain";
import { yen } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ai?: string; error?: string }>;
}) {
  const user = await requireUser("seller");
  const { id } = await params;
  const sp = await searchParams;
  const product = getProduct(Number(id));
  if (!product || product.seller_id !== user.id) redirect("/sell");

  const categories = listCategories();
  const settings = getSettings();
  const badges = parseBadges(product.badges);
  const isTemplate = product.is_template === 1;

  return (
    <>
      <AppBar
        title={isTemplate ? "定期商品を編集" : "商品を編集"}
        backHref={isTemplate ? "/sell/templates" : "/sell"}
      />
      <main className="phone-main">
        {sp.ai === "1" && (
          <div className="ok-box">
            AIが説明文の下書きを保存しました。内容を確認して、必要なら直してから「保存する」を押してください。
          </div>
        )}
        {sp.error === "cost" && (
          <div className="error-box">お渡し金額（1円以上）を入れてください。</div>
        )}

        <img
          src={product.photo || "/img/hokke.svg"}
          alt={product.title}
          style={{
            width: "100%",
            height: 180,
            objectFit: "cover",
            borderRadius: 12,
            marginBottom: 14,
          }}
        />

        <form action={saveProduct}>
          <input type="hidden" name="id" value={product.id} />

          <div className="field">
            <label htmlFor="p-title">商品名</label>
            <input id="p-title" className="input" name="title" defaultValue={product.title} />
          </div>

          <div className="field">
            <label htmlFor="p-category">カテゴリ</label>
            <select
              id="p-category"
              className="input"
              name="category_id"
              defaultValue={product.category_id}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="p-cost">お渡し金額（あなたが受け取る金額・1つあたり）</label>
            <div className="row">
              <input
                id="p-cost"
                className="input input-xl grow"
                name="cost_price"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={product.cost_price}
              />
              <span style={{ fontSize: 18, fontWeight: 800 }}>円</span>
            </div>
            <p className="hint">
              いまの売り場の価格（税込）：{yen(product.sale_price)}（手数料
              {settings.margin_rate}%込み）。金額を変えると保存時に自動で計算し直します。
            </p>
          </div>

          <div className="field">
            <label htmlFor="p-stock">
              {isTemplate ? "1回あたりの標準数量" : "残り在庫（数量）"}
            </label>
            <input
              id="p-stock"
              className="input"
              name="stock"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={product.stock}
              style={{ width: 120, textAlign: "center", fontWeight: 800 }}
            />
          </div>

          <div className="field">
            <label>温度帯</label>
            <div className="seg">
              {TEMP_ZONES.map((t) => (
                <label key={t.value}>
                  <input
                    type="radio"
                    name="temp_zone"
                    value={t.value}
                    defaultChecked={product.temp_zone === t.value}
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label>バッジ（あてはまるものに印）</label>
            <div className="seg">
              {BADGE_OPTIONS.map((b) => (
                <label key={b}>
                  <input
                    type="checkbox"
                    name="badges"
                    value={b}
                    defaultChecked={badges.includes(b)}
                  />
                  <span>{b}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-shipping">送料（1回の発送あたり）</label>
            <div className="row">
              <input
                id="p-shipping"
                className="input"
                name="shipping_fee"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={product.shipping_fee}
                style={{ width: 140, textAlign: "right", fontWeight: 800 }}
              />
              <span style={{ fontWeight: 800 }}>円</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-deadline">当日発送の締切時刻</label>
            <input
              id="p-deadline"
              className="input"
              name="deadline_time"
              type="time"
              defaultValue={product.deadline_time}
              style={{ width: 160 }}
            />
            <p className="hint">この時刻までの注文は、その日のうちに発送します。</p>
          </div>

          <div className="field">
            <label htmlFor="p-description">説明文</label>
            <textarea
              id="p-description"
              className="input"
              name="description"
              rows={6}
              defaultValue={product.description}
              placeholder="品物のよいところ、おすすめの使い方などを書きます。"
            />
            <button
              type="submit"
              formAction={generateAiDescription}
              className="btn btn-ghost btn-block"
            >
              🤖 AIに説明文を書いてもらう
            </button>
            <p className="hint">
              押すと今の入力内容をいったん保存し、AIが説明文の下書きを書きます。あとから自由に直せます。
            </p>
          </div>

          {!isTemplate && (
            <div className="field">
              <label>売り場の表示</label>
              <div className="seg">
                <label>
                  <input
                    type="radio"
                    name="is_public"
                    value="1"
                    defaultChecked={product.is_public === 1}
                  />
                  <span>売り場に出す</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="is_public"
                    value="0"
                    defaultChecked={product.is_public !== 1}
                  />
                  <span>売り場から下げる</span>
                </label>
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-xl btn-block" type="submit">
            保存する
          </button>
        </form>
      </main>
    </>
  );
}
