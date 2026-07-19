import type { Badge, TempZone } from "./types";

/** 温度帯の選択肢（出品フォーム・編集フォーム共通） */
export const TEMP_ZONES: { value: TempZone; label: string }[] = [
  { value: "frozen", label: "冷凍" },
  { value: "chilled", label: "冷蔵" },
  { value: "ambient", label: "常温" },
];

/** バッジ候補（NEW/人気/朝どれ/訳あり） */
export const BADGE_OPTIONS: Badge[] = ["NEW", "人気", "朝どれ", "訳あり"];

/** 写真未登録時のデフォルト画像。カテゴリ名から絵柄を選ぶ（魚以外も自然に見えるように） */
const CATEGORY_PHOTO: Record<string, string> = {
  鮮魚: "/img/hokke.svg",
  野菜: "/img/onion.svg",
  果物: "/img/melon.svg",
  加工品: "/img/himono.svg",
};
export const DEFAULT_PHOTO = "/img/hokke.svg";

export function photoForCategory(categoryName?: string): string {
  if (categoryName && CATEGORY_PHOTO[categoryName]) return CATEGORY_PHOTO[categoryName];
  return DEFAULT_PHOTO;
}

/** バッジのJSON文字列を安全に配列へ */
export function parseBadges(json: string): Badge[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? (arr as Badge[]) : [];
  } catch {
    return [];
  }
}
