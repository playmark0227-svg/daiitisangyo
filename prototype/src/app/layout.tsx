import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "うみさとマルシェ｜北海道一次産業 受発注プラットフォーム",
  description:
    "北海道の一次産業（農業・漁業）の生産物を、飲食店・百貨店・惣菜工場へ直接つなぐ受発注アプリのプロトタイプ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f5f74",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
