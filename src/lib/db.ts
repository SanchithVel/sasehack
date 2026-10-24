// Tiny JSON-file database at data/db.json. Seeded with demo data on first run.
// Fine for a local demo; on a serverless host (Vercel) writes won't persist,
// so swap this for Supabase if you deploy.
import fs from "node:fs";
import path from "node:path";
import type { Db } from "@/lib/types";
import { demoDb } from "@/lib/data/demo";

const FILE = path.join(process.cwd(), "data", "db.json");

export function getDb(): Db {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Db;
  } catch {
    const db = demoDb();
    saveDb(db);
    return db;
  }
}

export function saveDb(db: Db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

/** Read, change, and save in one step. */
export function updateDb(fn: (db: Db) => void) {
  const db = getDb();
  fn(db);
  saveDb(db);
  return db;
}

export const menuItem = (db: Db, id: string) => db.menu.find((m) => m.id === id);
