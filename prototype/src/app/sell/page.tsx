import Link from "next/link";
import Badges from "@/components/Badges";
import AppBar from "@/components/seller/AppBar";
import PublicToggle from "@/components/seller/PublicToggle";
import { getSettings, isPastDeadline, listSellerProducts, minutesToDeadline } from "@/lib/domain";
import { yen } from "@/lib/format";
import { requireUser } from "@/lib/session";

function remainLabel(min: number): string {
  if (min >= 60) return `残り${Math.floor(min / 60)}時間${min % 60}分`;
  return `残り${min}分`;
}

export default async function SellHome({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const user = await requireUser("seller");
  const products = listSellerProducts(user.id);
  const settings = getSettings();

  return (
    <>
      <AppBar title={`${settings.service_name} 出品`} />
      <main className="phone-main">
        {saved === "1" && <div className="ok-box">保存しました。</div>}

        <Link href="/sell/new" className="btn btn-warm btn-xl btn-block">
          ＋ 出品する
        </Link>
        <Link
          href="/sell/templates"
          className="btn btn-ghost btn-block"
          style={{ marginTop: 10 }}
        >
          いつもの商品から出品
        </Link>

        <div className="sec-h">
          あなたの出品
          <span className="sec-sub">スイッチで売り場に出す・下げるを切替</span>
        </div>

        {products.length === 0 ? (
          <div className="card" style={{ textAlign: "center", color: "var(--ink-soft)" }}>
            まだ出品がありません。
            <br />
            上の「＋ 出品する」から始めましょう。
          </div>
        ) : (
          <div className="list">
            {products.map((p) => {
              const past = isPastDeadline(p.deadline_time);
              const min = minutesToDeadline(p.deadline_time);
              return (
                <div className="pcard" key={p.id}>
                  <img className="pc-photo" src={p.photo || "/img/hokke.svg"} alt={p.title} />
                  <div className="pc-body">
                    <Badges badges={p.badges} temp={p.temp_zone} />
                    <div className="pc-title">{p.title}</div>
                    <div className="pc-price">
                      {yen(p.sale_price)}{" "}
                      <small>（税込）あなたの受取 {yen(p.cost_price)}</small>
                    </div>
                    <div className="pc-meta">
                      {p.stock === 0 ? (
                        <span className="soldout">売り切れ</span>
                      ) : (
                        <>残り {p.stock}</>
                      )}
                      {" ・ "}
                      {past ? (
                        <span className="deadline past">本日分は締切済み（{p.deadline_time}）</span>
                      ) : (
                        <span className="deadline">
                          {p.deadline_time}まで当日発送（{remainLabel(min)}）
                        </span>
                      )}
                    </div>
                    <div className="row" style={{ marginTop: 8 }}>
                      <span className="grow">
                        <PublicToggle id={p.id} isPublic={p.is_public === 1} />
                      </span>
                      <Link className="btn btn-ghost btn-sm" href={`/sell/p/${p.id}/edit`}>
                        編集
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
