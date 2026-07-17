import { getSettings, salePriceFromCost } from "@/lib/domain";
import { adminSaveMargin } from "@/actions/admin";

const yen = (n: number) => n.toLocaleString("ja-JP") + "円";
const PREVIEW_COSTS = [1000, 3800, 6400];

export default async function AdminMarginPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { done, error } = await searchParams;
  const settings = getSettings();

  return (
    <>
      <h1 className="admin-h1">手数料（マージン）設定</h1>

      {done === "1" && <div className="ok-box">設定を保存しました。</div>}
      {error === "rate" && (
        <div className="error-box">手数料率は 0〜100 の数字で入力してください。</div>
      )}
      {error === "deadline" && (
        <div className="error-box">締切時刻の形式が正しくありません（例: 13:00）。</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>
        <form action={adminSaveMargin} className="card">
          <div className="field">
            <label>手数料率（%）</label>
            <input
              className="input input-xl"
              name="margin_rate"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={settings.margin_rate}
            />
            <span className="hint">
              販売価格 = 原価 ×（1 + 手数料率）を10円単位で切り上げた金額になります。
            </span>
          </div>
          <div className="field">
            <label>デフォルト締切時刻（当日発送の注文締切）</label>
            <input
              className="input"
              name="default_deadline"
              type="time"
              defaultValue={settings.default_deadline}
              style={{ maxWidth: 180 }}
            />
            <span className="hint">新しく出品する商品の初期値として使われます。</span>
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            設定を保存する
          </button>
          <div className="demo-note" style={{ marginBottom: 0 }}>
            既存商品の販売価格は変わりません。新しい手数料率は次回の出品から適用されます。
          </div>
        </form>

        <div>
          <div className="sec-h" style={{ marginTop: 0 }}>
            価格プレビュー
            <span className="sec-sub">現在の手数料率 {settings.margin_rate}% での計算例</span>
          </div>
          <div className="tbl-wrap" style={{ maxWidth: 520 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="num">原価（出品者の受取ベース）</th>
                  <th className="num">販売価格（税込）</th>
                  <th className="num">上乗せ額</th>
                </tr>
              </thead>
              <tbody>
                {PREVIEW_COSTS.map((cost) => {
                  const sale = salePriceFromCost(cost, settings.margin_rate);
                  return (
                    <tr key={cost}>
                      <td className="num">{yen(cost)}</td>
                      <td className="num" style={{ fontWeight: 800 }}>
                        {yen(sale)}
                      </td>
                      <td className="num">{yen(sale - cost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            端数は発注者に分かりやすいよう10円単位で切り上げています。
          </p>
        </div>
      </div>
    </>
  );
}
