import AppBar from "@/components/seller/AppBar";
import { createTemplate } from "@/actions/seller";
import { BADGE_OPTIONS, TEMP_ZONES } from "@/lib/catalog";
import { getSettings, listCategories } from "@/lib/domain";
import { requireUser } from "@/lib/session";

const PHOTO_OPTIONS = [
  { value: "/img/hokke.svg", label: "ホッケ（魚）" },
  { value: "/img/sake.svg", label: "サケ" },
  { value: "/img/ika.svg", label: "イカ" },
  { value: "/img/kegani.svg", label: "毛ガニ" },
  { value: "/img/himono.svg", label: "干物" },
  { value: "/img/potato.svg", label: "じゃがいも" },
  { value: "/img/asparagus.svg", label: "アスパラ" },
  { value: "/img/onion.svg", label: "玉ねぎ" },
  { value: "/img/melon.svg", label: "メロン" },
];

export default async function NewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser("seller");
  const { error } = await searchParams;
  const categories = listCategories();
  const settings = getSettings();

  return (
    <>
      <AppBar title="新しい定期商品" backHref="/sell/templates" />
      <main className="phone-main">
        {error === "title" && <div className="error-box">商品名を入れてください。</div>}
        {error === "cost" && (
          <div className="error-box">お渡し金額（1円以上）を入れてください。</div>
        )}

        <p className="muted" style={{ margin: "2px 0 14px" }}>
          いつも売っている商品を登録します。登録すると、毎日は数量を入れるだけで出品できます。
        </p>

        <form action={createTemplate}>
          <div className="field">
            <label htmlFor="t-title">商品名</label>
            <input
              id="t-title"
              className="input"
              name="title"
              placeholder="例：富良野玉ねぎ 20kg"
            />
          </div>

          <div className="field">
            <label htmlFor="t-category">カテゴリ</label>
            <select
              id="t-category"
              className="input"
              name="category_id"
              defaultValue={categories[0]?.id}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="t-cost">お渡し金額（あなたが受け取る金額・1つあたり）</label>
            <div className="row">
              <input
                id="t-cost"
                className="input input-xl grow"
                name="cost_price"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
              />
              <span style={{ fontSize: 18, fontWeight: 800 }}>円</span>
            </div>
            <p className="hint">
              売り場の価格（税込）は「お渡し金額＋手数料{settings.margin_rate}%」で自動計算されます。
            </p>
          </div>

          <div className="field">
            <label htmlFor="t-stock">1回あたりの標準数量（出品時に変えられます）</label>
            <input
              id="t-stock"
              className="input"
              name="stock"
              type="number"
              min={1}
              inputMode="numeric"
              defaultValue={1}
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
                    defaultChecked={t.value === "chilled"}
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
                  <input type="checkbox" name="badges" value={b} />
                  <span>{b}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="t-photo">写真（見本から選択。あとで編集できます）</label>
            <select id="t-photo" className="input" name="photo" defaultValue="/img/hokke.svg">
              {PHOTO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="t-shipping">送料（1回の発送あたり）</label>
            <div className="row">
              <input
                id="t-shipping"
                className="input"
                name="shipping_fee"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={0}
                style={{ width: 140, textAlign: "right", fontWeight: 800 }}
              />
              <span style={{ fontWeight: 800 }}>円</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="t-deadline">当日発送の締切時刻</label>
            <input
              id="t-deadline"
              className="input"
              name="deadline_time"
              type="time"
              defaultValue={settings.default_deadline}
              style={{ width: 160 }}
            />
            <p className="hint">この時刻までの注文は、その日のうちに発送します。</p>
          </div>

          <div className="field">
            <label htmlFor="t-description">説明文（入れなくてもOK）</label>
            <textarea
              id="t-description"
              className="input"
              name="description"
              rows={4}
              placeholder="例：貯蔵性の高い定番玉ねぎ。毎日一定量出荷できます。"
            />
          </div>

          <button className="btn btn-primary btn-xl btn-block" type="submit">
            定期商品として登録する
          </button>
        </form>
      </main>
    </>
  );
}
