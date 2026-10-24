// In-memory "database" seeded with demo data. It resets when the server
// restarts — swap for Supabase if you need persistence.
import type { DailyRecord, SurplusPost, WasteLog } from "@/lib/types";
import { MENU } from "@/lib/data/business";
import { addDays, isoDate } from "@/lib/dates";

const HISTORY_DAYS = 35;
/** Days at the end of the history where the owner followed the app's prep forecast. */
const USING_APP_DAYS = 10;

// Deterministic PRNG so the demo data is the same on every run.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DAY_FACTOR = [0.9, 0.75, 0.95, 1.0, 1.05, 1.25, 1.3]; // Sun..Sat

function seedHistory(): DailyRecord[] {
  const rand = mulberry32(42);
  const today = new Date();
  const records: DailyRecord[] = [];
  for (let i = HISTORY_DAYS; i >= 1; i--) {
    const day = addDays(today, -i);
    const factor = DAY_FACTOR[day.getDay()];
    const usingApp = i <= USING_APP_DAYS;
    for (const item of MENU) {
      const demand = item.usualPrep * factor * (0.72 + rand() * 0.22);
      const prepared = usingApp
        ? Math.round(item.usualPrep * factor * 0.9)
        : item.usualPrep;
      const sold = Math.min(prepared, Math.round(demand * 10) / 10);
      records.push({
        date: isoDate(day),
        itemId: item.id,
        prepared,
        sold,
        wasted: Math.round((prepared - sold) * 10) / 10,
      });
    }
  }
  return records;
}

function seedSurplus(): SurplusPost[] {
  const today = new Date();
  const partners = ["City Rescue Mission", "Regional Food Bank of Oklahoma", "Homeless Alliance Day Shelter"];
  return Array.from({ length: 8 }, (_, i) => ({
    id: `seed-${i}`,
    createdAt: addDays(today, -(i * 4 + 1)).toISOString(),
    items: [
      { name: "Mexican rice", quantity: 4 + (i % 3), unit: "lbs" },
      { name: "Carne asada", quantity: 3 + (i % 2), unit: "lbs" },
      { name: "Corn tortillas", quantity: 5, unit: "dozen" },
    ],
    estLbs: 13 + (i % 3) + (i % 2),
    pickupBy: "9:30 PM",
    status: "claimed" as const,
    claimedBy: partners[i % partners.length],
  }));
}

type Store = { records: DailyRecord[]; logs: WasteLog[]; surplus: SurplusPost[] };

// Keep the store on globalThis so dev hot reloads don't wipe it.
const g = globalThis as unknown as { __store?: Store };
export const store: Store = (g.__store ??= {
  records: seedHistory(),
  logs: [],
  surplus: seedSurplus(),
});

export function addWasteLogs(logs: Omit<WasteLog, "id" | "date">[]) {
  const date = isoDate(new Date());
  const created = logs.map((l) => ({ ...l, id: crypto.randomUUID(), date }));
  store.logs.push(...created);
  return created;
}

export function addSurplus(post: Pick<SurplusPost, "items" | "estLbs" | "pickupBy">) {
  const created: SurplusPost = {
    ...post,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "open",
  };
  store.surplus.unshift(created);
  return created;
}

export function claimSurplus(id: string, partnerName: string) {
  const post = store.surplus.find((p) => p.id === id);
  if (post && post.status === "open") {
    post.status = "claimed";
    post.claimedBy = partnerName;
  }
  return post;
}
