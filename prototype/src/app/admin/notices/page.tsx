import { adminSendNotice } from "@/actions/admin";

export default async function AdminNoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <>
      <h1 className="admin-h1">お知らせ配信</h1>

      {sent === "1" && <div className="ok-box">お知らせを配信しました。</div>}
      {error === "empty" && <div className="error-box">メッセージを入力してください。</div>}

      <form action={adminSendNotice} className="card" style={{ maxWidth: 560 }}>
        <div className="field">
          <label>宛先</label>
          <select className="input" name="target" defaultValue="all">
            <option value="buyer">発注者のみ</option>
            <option value="seller">出品者のみ</option>
            <option value="all">全員（発注者＋出品者）</option>
          </select>
        </div>
        <div className="field">
          <label>メッセージ</label>
          <textarea
            className="input"
            name="message"
            rows={5}
            placeholder="例: 明日は市場休業日のため、13時以降のご注文は明後日の発送になります。"
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit">
          配信する
        </button>
        <div className="demo-note" style={{ marginBottom: 0 }}>
          プッシュ通知のデモです。各ユーザーのアプリ内通知ベルに届きます。
        </div>
      </form>
    </>
  );
}
