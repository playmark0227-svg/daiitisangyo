import { parseBadges } from "@/lib/catalog";
import { TEMP_LABEL } from "@/lib/types";
import type { TempZone } from "@/lib/types";

/**
 * 商品バッジ＋温度帯の共通表示。buyer/seller/admin すべてで使う。
 * badges は products.badges のJSON文字列をそのまま渡す。
 */
export default function Badges({
  badges,
  temp,
  showTemp = true,
}: {
  badges: string;
  temp?: TempZone;
  showTemp?: boolean;
}) {
  const list = parseBadges(badges);
  if (list.length === 0 && !(showTemp && temp)) return null;
  return (
    <div className="badges">
      {list.map((b) => (
        <span key={b} className={`badge badge-${b}`}>
          {b}
        </span>
      ))}
      {showTemp && temp && <span className="badge badge-temp">{TEMP_LABEL[temp]}</span>}
    </div>
  );
}
