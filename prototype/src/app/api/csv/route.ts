import { NextResponse } from "next/server";
import { getUser } from "@/lib/session";
import { ordersCsv } from "@/lib/domain";

/** 取引明細CSVダウンロード（管理者のみ, F-208） */
export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const csv = ordersCsv();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders.csv"',
    },
  });
}
