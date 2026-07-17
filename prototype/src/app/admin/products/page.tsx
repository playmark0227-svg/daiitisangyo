import Link from "next/link";
import { listAllProducts } from "@/lib/domain";
import { TEMP_LABEL, type Badge, type TempZone } from "@/lib/types";
import { adminSetProductPublic } from "@/actions/admin";
import ToggleForm from "../toggle-form";

const yen = (n: number) => n.toLocaleString("ja-JP") + "円";

export default async function AdminProductsPage() {
  const products = listAllProducts();
  return (
    <>
      <h1 className="admin-h1">商品管理</h1>
      <p className="muted" style={{ margin: "0 0 14px" }}>
        公開トグルを切り替えると、すぐに売り場（発注者アプリ）へ反映されます。「定期」は出品者が毎日使うテンプレートです。
      </p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>写真</th>
              <th>商品名</th>
              <th>出品者</th>
              <th>カテゴリ</th>
              <th className="num">原価</th>
              <th className="num">販売価格（税込）</th>
              <th className="num">在庫</th>
              <th>バッジ</th>
              <th>公開</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const badges = JSON.parse(p.badges) as Badge[];
              return (
                <tr key={p.id}>
                  <td>
                    {p.photo ? (
                      <img
                        src={p.photo}
                        alt=""
                        width={32}
                        height={32}
                        style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 7, border: "1px solid var(--border)" }}
                      />
                    ) : (
                      <span
                        style={{ display: "inline-block", width: 32, height: 32, borderRadius: 7, background: "var(--surface-2)", border: "1px solid var(--border)" }}
                      />
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{p.title}</span>
                    {p.is_template === 1 && (
                      <span className="badge badge-temp" style={{ marginLeft: 6 }}>
                        定期
                      </span>
                    )}
                  </td>
                  <td>{p.seller_name}</td>
                  <td>{p.category_name}</td>
                  <td className="num">{yen(p.cost_price)}</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {yen(p.sale_price)}
                  </td>
                  <td className="num">
                    {p.stock === 0 ? <span className="soldout">売り切れ</span> : p.stock}
                  </td>
                  <td>
                    <span className="badges">
                      <span className="badge badge-temp">{TEMP_LABEL[p.temp_zone as TempZone]}</span>
                      {badges.map((b) => (
                        <span key={b} className={`badge badge-${b}`}>
                          {b}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td>
                    <ToggleForm
                      action={adminSetProductPublic}
                      checked={p.is_public === 1}
                      hidden={{ id: p.id, next: p.is_public === 1 ? "0" : "1" }}
                      title={p.is_public === 1 ? "売り場から下げる" : "売り場に出す"}
                    />
                  </td>
                  <td>
                    <Link href={`/admin/products/${p.id}`}>編集</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
