import { connection } from "next/server";
import { getDb, updateDb } from "@/lib/db";
import { isoDate } from "@/lib/dates";
import { wasteByDay } from "@/lib/impact";
import type { DailyRecord } from "@/lib/types";

// GET ?date=YYYY-MM-DD → that day's entries, the menu, and recently logged days.
export async function GET(req: Request) {
  await connection();
  const today = isoDate(new Date());
  const date = new URL(req.url).searchParams.get("date") ?? today;
  const db = getDb();
  return Response.json({
    date,
    today,
    menu: db.menu,
    entries: db.records.filter((r) => r.date === date),
    recent: wasteByDay(db).reverse().slice(0, 14),
  });
}

// PUT { date, entries } → replace that day's log.
export async function PUT(req: Request) {
  const { date, entries } = (await req.json()) as { date: string; entries: Omit<DailyRecord, "date">[] };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: "Invalid date" }, { status: 400 });
  const num = (v: unknown) => Math.max(0, Number(v) || 0);
  updateDb((db) => {
    db.records = db.records.filter((r) => r.date !== date);
    for (const e of entries) {
      if (!db.menu.some((m) => m.id === e.itemId)) continue;
      const prepared = num(e.prepared);
      db.records.push({
        date,
        itemId: e.itemId,
        prepared,
        sold: Math.min(num(e.sold), prepared),
        wasted: Math.min(num(e.wasted), prepared),
      });
    }
  });
  return Response.json({ ok: true });
}
