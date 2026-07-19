/**
 * 価格計算（クライアント/サーバー共通の純関数）。
 * 加算モデル(F-007): 販売価格 = 原価 ×(1 + 手数料率/100) を10円単位で切り上げ。
 * ※確定値はサーバーの createProduct/updateProduct で再計算する（クライアントは表示プレビュー用）。
 */
export function salePrice(cost: number, marginRate: number): number {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  return Math.ceil((cost * (1 + marginRate / 100)) / 10) * 10;
}
