"use client";

/**
 * トグルスイッチ1つだけのフォーム。切り替えた瞬間にサーバーアクションへ送信する。
 * action はサーバーコンポーネントから props で渡す（サーバーアクションは serializable）。
 */
export default function ToggleForm({
  action,
  checked,
  hidden,
  title,
}: {
  action: (formData: FormData) => Promise<void>;
  checked: boolean;
  hidden: Record<string, string | number>;
  title?: string;
}) {
  return (
    <form action={action} style={{ display: "inline-block" }}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label className="toggle" title={title}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
        <span className="tg" />
      </label>
    </form>
  );
}
