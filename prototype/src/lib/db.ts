import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

let _db: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const fresh = !fs.existsSync(DB_PATH);
  _db = new DatabaseSync(DB_PATH);
  _db.exec("PRAGMA journal_mode = WAL;");
  migrate(_db);
  if (fresh) seed(_db);
  return _db;
}

function migrate(d: DatabaseSync) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','seller','buyer')),
    org TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL DEFAULT '',
    cost_price INTEGER NOT NULL,
    sale_price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 1,
    temp_zone TEXT NOT NULL DEFAULT 'chilled' CHECK(temp_zone IN ('frozen','chilled','ambient')),
    badges TEXT NOT NULL DEFAULT '[]',
    is_public INTEGER NOT NULL DEFAULT 1,
    is_template INTEGER NOT NULL DEFAULT 0,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    deadline_time TEXT NOT NULL DEFAULT '13:00',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid'
      CHECK(status IN ('paid','shipped','cancel_requested','refunded')),
    items_total INTEGER NOT NULL,
    shipping_total INTEGER NOT NULL,
    grand_total INTEGER NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    address_label TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    photo TEXT NOT NULL DEFAULT '',
    temp_zone TEXT NOT NULL DEFAULT 'chilled',
    qty INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    unit_cost INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    address TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    link TEXT NOT NULL DEFAULT '',
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS invite_codes (
    code TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    used_by INTEGER
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `);
}

function seed(d: DatabaseSync) {
  const insUser = d.prepare(
    "INSERT INTO users (name, role, org, phone) VALUES (?,?,?,?)"
  );
  // 1 admin
  insUser.run("運営 事務局", "admin", "プラットフォーム運営会社", "011-000-0000");
  // 2-4 sellers
  insUser.run("佐藤 一郎", "seller", "佐藤漁業（日高）", "090-1111-2222");
  insUser.run("田中 花子", "seller", "田中農園（富良野）", "090-3333-4444");
  insUser.run("日高漁協", "seller", "ひだか漁業協同組合", "0146-00-0000");
  // 5-7 buyers
  insUser.run("海風 太郎", "buyer", "レストラン海風（札幌）", "011-555-6666");
  insUser.run("丸山 京子", "buyer", "丸山百貨店 食品部", "011-777-8888");
  insUser.run("北 健二", "buyer", "惣菜工場キッチン北", "0123-99-0000");

  const insCat = d.prepare("INSERT INTO categories (name, sort) VALUES (?,?)");
  insCat.run("鮮魚", 1);
  insCat.run("野菜", 2);
  insCat.run("果物", 3);
  insCat.run("加工品", 4);

  d.prepare(
    "INSERT INTO settings (key, value) VALUES ('margin_rate','15'),('default_deadline','23:59'),('service_name','うみさとマルシェ')"
  ).run();

  const margin = 15;
  const price = (cost: number) => Math.ceil((cost * (1 + margin / 100)) / 10) * 10;

  const insP = d.prepare(`INSERT INTO products
    (seller_id, category_id, title, description, photo, cost_price, sale_price, stock,
     temp_zone, badges, is_public, is_template, shipping_fee, deadline_time)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  // 鮮魚（佐藤漁業 / 日高漁協）
  // 締切時刻はデモをいつ触っても両方の状態が見えるよう、夜締切と朝締切（締切済み例）を混在させる
  insP.run(2, 1, "朝どれ真ホッケ 5kg箱", "今朝、日高沖で水揚げした真ホッケです。型が良く脂のりも十分。箱のまま氷詰めでお届けします。", "/img/hokke.svg", 3800, price(3800), 6, "chilled", JSON.stringify(["朝どれ", "NEW"]), 1, 0, 1200, "23:59");
  insP.run(2, 1, "秋鮭（雄）1本 約3kg", "定置網の秋鮭。身色良好、ハラス厚め。飲食店の焼き物・ちゃんちゃん焼きに。", "/img/sake.svg", 2600, price(2600), 4, "chilled", JSON.stringify(["人気"]), 1, 0, 1200, "23:59");
  insP.run(4, 1, "訳あり 傷スルメイカ 3kg", "網傷で市場に出せないスルメイカ。鮮度は抜群、加工用・まかないに最適です。", "/img/ika.svg", 1500, price(1500), 10, "chilled", JSON.stringify(["訳あり"]), 1, 0, 1000, "12:00");
  insP.run(4, 1, "冷凍 毛ガニ 500g×2尾", "浜茹で後に急速冷凍。堅蟹のみ選別。ギフト・宴会コースに。", "/img/kegani.svg", 6400, price(6400), 3, "frozen", JSON.stringify(["人気"]), 1, 0, 1400, "11:00");
  // 野菜（田中農園）— 定期商品テンプレート含む
  insP.run(3, 2, "富良野産 じゃがいも(キタアカリ) 10kg", "毎日出荷できる定番。ホクホク系で煮崩れしにくく、惣菜・コロッケ向き。", "/img/potato.svg", 1800, price(1800), 20, "ambient", JSON.stringify([]), 1, 1, 900, "23:59");
  insP.run(3, 2, "朝採りアスパラ 2Lサイズ 1kg", "その日の朝に収穫したグリーンアスパラ。太物のみ選別。", "/img/asparagus.svg", 2400, price(2400), 8, "chilled", JSON.stringify(["朝どれ", "NEW"]), 1, 0, 900, "23:59");
  insP.run(3, 2, "富良野玉ねぎ 20kg", "貯蔵性の高い定番玉ねぎ。毎日一定量出荷可能です。", "/img/onion.svg", 2000, price(2000), 15, "ambient", JSON.stringify([]), 1, 1, 1100, "23:59");
  insP.run(3, 3, "訳あり 富良野メロン 2玉", "ツル割れ・皮傷で贈答に回せないメロン。糖度は14度以上あります。", "/img/melon.svg", 2200, price(2200), 0, "chilled", JSON.stringify(["訳あり", "人気"]), 1, 0, 1000, "12:00");
  // 加工品
  insP.run(4, 4, "ほっけ一夜干し 10枚", "組合加工場で仕上げた一夜干し。冷凍便でお届けします。", "/img/himono.svg", 3000, price(3000), 12, "frozen", JSON.stringify([]), 1, 0, 1000, "23:59");

  // 発注者の配送先
  const insAddr = d.prepare(
    "INSERT INTO addresses (buyer_id, label, address) VALUES (?,?,?)"
  );
  insAddr.run(5, "店舗", "札幌市中央区南3条西4丁目 海風ビル1F");
  insAddr.run(5, "セントラルキッチン", "札幌市白石区平和通2丁目 3-1");
  insAddr.run(6, "食品部 受入口", "札幌市中央区北1条東2丁目 丸山百貨店B1");
  insAddr.run(7, "工場", "千歳市泉沢1007-1 キッチン北 第一工場");

  // 招待コード（クローズドβ想定）
  const insInv = d.prepare(
    "INSERT INTO invite_codes (code, role, note) VALUES (?,?,?)"
  );
  insInv.run("UMI-2026", "buyer", "既存取引先（発注者）向け");
  insInv.run("SATO-2026", "seller", "生産者向け");

  // デモ用の過去注文（ダッシュボードに数字が出るように）
  const insOrder = d.prepare(`INSERT INTO orders
    (buyer_id, status, items_total, shipping_total, grand_total, address, address_label, created_at)
    VALUES (?,?,?,?,?,?,?,datetime('now','localtime',?))`);
  const insItem = d.prepare(`INSERT INTO order_items
    (order_id, product_id, seller_id, title, photo, temp_zone, qty, unit_price, unit_cost)
    VALUES (?,?,?,?,?,?,?,?,?)`);

  const o1 = insOrder.run(5, "shipped", price(3800) * 2, 1200, price(3800) * 2 + 1200, "札幌市中央区南3条西4丁目 海風ビル1F", "店舗", "-2 days").lastInsertRowid as number;
  insItem.run(o1, 1, 2, "朝どれ真ホッケ 5kg箱", "/img/hokke.svg", "chilled", 2, price(3800), 3800);
  const o2 = insOrder.run(7, "shipped", price(1800) * 3 + price(2000), 2000, price(1800) * 3 + price(2000) + 2000, "千歳市泉沢1007-1 キッチン北 第一工場", "工場", "-1 days").lastInsertRowid as number;
  insItem.run(o2, 5, 3, "富良野産 じゃがいも(キタアカリ) 10kg", "/img/potato.svg", "ambient", 3, price(1800), 1800);
  insItem.run(o2, 7, 3, "富良野玉ねぎ 20kg", "/img/onion.svg", "ambient", 1, price(2000), 2000);
}
