/**
 * 表示整形の共通ユーティリティ。
 * サーバー/クライアント両方から使えるよう、DB等のサーバー専用importは持たない。
 */

/** 金額を「1,234円」形式に整形（アプリ全体で統一） */
export function yen(n: number): string {
  return n.toLocaleString("ja-JP") + "円";
}

/**
 * 「YYYY-MM-DD HH:MM:SS」形式のTEXT日時を「YYYY/MM/DD HH:MM」に整形。
 * created_at は datetime('now','localtime') 由来のローカル時刻文字列。
 */
export function formatDateTime(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return v;
  const [, y, mo, d, h, mi] = m;
  return `${y}/${mo}/${d} ${h}:${mi}`;
}

/** 「YYYY/MM/DD」だけ返す（日付のみ表示用） */
export function formatDate(v: string): string {
  return formatDateTime(v).slice(0, 10);
}
