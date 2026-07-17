export type Role = "admin" | "seller" | "buyer";

export type TempZone = "frozen" | "chilled" | "ambient";
export const TEMP_LABEL: Record<TempZone, string> = {
  frozen: "冷凍",
  chilled: "冷蔵",
  ambient: "常温",
};

export type Badge = "NEW" | "人気" | "朝どれ" | "訳あり";

export interface User {
  id: number;
  name: string;
  role: Role;
  org: string;
  phone: string;
  active: number; // 1=active 0=stopped
}

export interface Category {
  id: number;
  name: string;
  sort: number;
}

export interface Product {
  id: number;
  seller_id: number;
  category_id: number;
  title: string;
  description: string;
  photo: string;
  cost_price: number; // 原価（出品者受取のベース）
  sale_price: number; // 販売価格（原価+マージン、出品時に確定）
  stock: number;
  temp_zone: TempZone;
  badges: string; // JSON array of Badge
  is_public: number; // 1=公開
  is_template: number; // 1=定期商品テンプレート
  shipping_fee: number;
  deadline_time: string; // "HH:MM" 当日発送締切
  created_at: string;
  // joined
  seller_name?: string;
  category_name?: string;
}

export type OrderStatus =
  | "paid" // 決済済み（デモ決済）
  | "shipped" // 発送済み
  | "cancel_requested" // 出品者から欠品キャンセル申請中
  | "refunded"; // 返金済み（キャンセル確定）

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "受付済み",
  shipped: "発送済み",
  cancel_requested: "欠品キャンセル申請中",
  refunded: "返金済み",
};

export interface Order {
  id: number;
  buyer_id: number;
  status: OrderStatus;
  items_total: number;
  shipping_total: number;
  grand_total: number;
  address: string;
  address_label: string;
  created_at: string;
  // joined
  buyer_name?: string;
  buyer_org?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;
  title: string;
  photo: string;
  temp_zone: TempZone;
  qty: number;
  unit_price: number; // 販売単価（注文時スナップショット）
  unit_cost: number; // 原価単価（同上）
  // joined
  seller_name?: string;
}

export interface Address {
  id: number;
  buyer_id: number;
  label: string;
  address: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  link: string;
  read: number;
  created_at: string;
}

export interface Settings {
  margin_rate: number; // % 例 15
  default_deadline: string; // "HH:MM"
  service_name: string;
}

export interface CartLine {
  productId: number;
  qty: number;
}
