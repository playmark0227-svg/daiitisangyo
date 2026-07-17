import { TEMP_LABEL, type TempZone } from "@/lib/types";

/** 商品バッジ（JSON文字列）＋温度帯バッジの表示 */
export default function Badges({
  badges,
  temp,
}: {
  badges?: string;
  temp?: TempZone;
}) {
  let list: string[] = [];
  if (badges) {
    try {
      const parsed = JSON.parse(badges);
      if (Array.isArray(parsed)) list = parsed.map(String);
    } catch {
      /* noop */
    }
  }
  if (list.length === 0 && !temp) return null;
  return (
    <span className="badges">
      {list.map((b) => (
        <span key={b} className={`badge badge-${b}`}>
          {b}
        </span>
      ))}
      {temp && <span className="badge badge-temp">{TEMP_LABEL[temp]}</span>}
    </span>
  );
}
