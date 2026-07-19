import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { getUser } from "@/lib/session";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** 先頭バイトが実際に画像形式か検証（クライアント申告のMIMEを信用しない） */
function looksLikeImage(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  switch (mime) {
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/png":
      return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    case "image/gif":
      return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
    case "image/webp":
      return buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
    default:
      return false;
  }
}

/** 商品写真アップロード（F-010）。出品者・管理者のみ。public/uploads に保存してパスを返す */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || (user.role !== "seller" && user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "ログインが必要です" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "ファイルがありません" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ ok: false, error: "画像ファイルを選択してください" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "8MB以下の画像にしてください" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(buf, file.type)) {
    return NextResponse.json({ ok: false, error: "画像ファイルを選択してください" }, { status: 400 });
  }
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${EXT[file.type]}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, name), buf);
  return NextResponse.json({ ok: true, path: `/uploads/${name}` });
}
