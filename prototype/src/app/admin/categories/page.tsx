import { listCategories } from "@/lib/domain";
import { adminSaveCategory } from "@/actions/admin";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { done, error } = await searchParams;
  const categories = listCategories();

  return (
    <>
      <h1 className="admin-h1">カテゴリ管理</h1>

      {done === "1" && <div className="ok-box">カテゴリを保存しました。</div>}
      {error === "name" && <div className="error-box">カテゴリ名を入力してください。</div>}

      <div className="sec-h">
        カテゴリ一覧
        <span className="sec-sub">表示順の数字が小さいほど売り場で先に表示されます</span>
      </div>
      <div className="list" style={{ maxWidth: 560 }}>
        {categories.map((c) => (
          <form key={c.id} action={adminSaveCategory} className="card row">
            <input type="hidden" name="id" value={c.id} />
            <span className="muted" style={{ width: 36 }}>
              #{c.id}
            </span>
            <span className="grow">
              <input className="input" name="name" defaultValue={c.name} aria-label="カテゴリ名" />
            </span>
            <span style={{ width: 90 }}>
              <input
                className="input"
                name="sort"
                type="number"
                defaultValue={c.sort}
                aria-label="表示順"
              />
            </span>
            <button className="btn btn-ghost btn-sm" type="submit">
              保存
            </button>
          </form>
        ))}
      </div>

      <div className="sec-h">カテゴリを追加</div>
      <form action={adminSaveCategory} className="card row" style={{ maxWidth: 560 }}>
        <span className="grow">
          <input className="input" name="name" placeholder="カテゴリ名（例: 米・穀物）" />
        </span>
        <span style={{ width: 90 }}>
          <input className="input" name="sort" type="number" defaultValue={categories.length + 1} aria-label="表示順" />
        </span>
        <button className="btn btn-primary btn-sm" type="submit">
          追加する
        </button>
      </form>
    </>
  );
}
