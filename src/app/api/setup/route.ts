import { connection } from "next/server";
import { getDb, saveDb, updateDb } from "@/lib/db";
import { demoDb, emptyDb } from "@/lib/data/demo";
import type { Db } from "@/lib/types";

const setupView = (db: Db) => ({ isDemo: db.isDemo, profile: db.profile, menu: db.menu, events: db.events });

// GET → business profile, menu, and events.
export async function GET() {
  await connection();
  return Response.json(setupView(getDb()));
}

// PUT { profile, menu, events } → save the owner's setup.
export async function PUT(req: Request) {
  const body = (await req.json()) as Pick<Db, "profile" | "menu" | "events">;
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);
  const db = updateDb((db) => {
    db.profile = body.profile;
    db.menu = body.menu
      .filter((m) => m.name.trim())
      .map((m) => ({
        ...m,
        name: m.name.trim(),
        usualPrep: num(m.usualPrep),
        costPerUnit: num(m.costPerUnit),
        pricePerUnit: num(m.pricePerUnit),
        lbsPerUnit: num(m.lbsPerUnit) || 1,
      }));
    db.events = body.events
      .filter((e) => e.name.trim() && e.date)
      .map((e) => ({ ...e, changePct: Number(e.changePct) || 0 }));
  });
  return Response.json(setupView(db));
}

// POST { action: "demo" | "reset" } → load demo data or start with a blank slate.
export async function POST(req: Request) {
  const { action } = (await req.json()) as { action: "demo" | "reset" };
  const db = action === "demo" ? demoDb() : emptyDb();
  saveDb(db);
  return Response.json(setupView(db));
}
