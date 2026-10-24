// Demo data for "Maria's Tacos" so the app has something to show before an
// owner enters their own numbers. Generated relative to today.
import type { DailyRecord, Db, LocalEvent, MenuItem, Profile, SurplusPost } from "@/lib/types";
import { addDays, isoDate } from "@/lib/dates";

const HISTORY_DAYS = 35;
/** Days at the end of the history where the owner followed the app's prep forecast. */
const USING_APP_DAYS = 10;
const DAY_FACTOR = [0.9, 0.75, 0.95, 1.0, 1.05, 1.25, 1.3]; // Sun..Sat

const DEMO_PROFILE: Profile = {
  name: "Maria's Tacos",
  ownerName: "Maria",
  cuisine: "Mexican street tacos",
  city: "Oklahoma City",
  lat: 35.4676,
  lng: -97.5164,
  address: "123 NW 23rd St, Oklahoma City, OK",
  phone: "(405) 555-0142",
  hours: "Tue–Sun 11am–9pm",
  description: "Family-run taqueria serving handmade tortillas and slow-cooked meats since 2015.",
};

const DEMO_MENU: MenuItem[] = [
  { id: "carne-asada", name: "Carne asada", category: "main", unit: "lbs", usualPrep: 30, costPerUnit: 7.5, pricePerUnit: 18, lbsPerUnit: 1 },
  { id: "al-pastor", name: "Al pastor", category: "main", unit: "lbs", usualPrep: 25, costPerUnit: 5, pricePerUnit: 15, lbsPerUnit: 1 },
  { id: "chicken-tinga", name: "Chicken tinga", category: "main", unit: "lbs", usualPrep: 20, costPerUnit: 3.5, pricePerUnit: 12, lbsPerUnit: 1 },
  { id: "rice", name: "Mexican rice", category: "side", unit: "lbs", usualPrep: 25, costPerUnit: 0.9, pricePerUnit: 6, lbsPerUnit: 1 },
  { id: "beans", name: "Refried beans", category: "side", unit: "lbs", usualPrep: 20, costPerUnit: 1.1, pricePerUnit: 6, lbsPerUnit: 1 },
  { id: "tortillas", name: "Corn tortillas", category: "bread", unit: "dozen", usualPrep: 40, costPerUnit: 1.5, pricePerUnit: 6, lbsPerUnit: 1.1 },
  { id: "pico", name: "Pico de gallo", category: "fresh", unit: "lbs", usualPrep: 10, costPerUnit: 2.2, pricePerUnit: 8, lbsPerUnit: 1 },
  { id: "guac", name: "Guacamole", category: "fresh", unit: "lbs", usualPrep: 8, costPerUnit: 6, pricePerUnit: 16, lbsPerUnit: 1 },
];

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

function demoRecords(): DailyRecord[] {
  const rand = mulberry32(42);
  const today = new Date();
  const records: DailyRecord[] = [];
  for (let i = HISTORY_DAYS; i >= 1; i--) {
    const day = addDays(today, -i);
    const factor = DAY_FACTOR[day.getDay()];
    for (const item of DEMO_MENU) {
      const demand = item.usualPrep * factor * (0.72 + rand() * 0.22);
      const prepared = i <= USING_APP_DAYS ? Math.round(item.usualPrep * factor * 0.9) : item.usualPrep;
      const sold = Math.min(prepared, Math.round(demand * 10) / 10);
      records.push({ date: isoDate(day), itemId: item.id, prepared, sold, wasted: Math.round((prepared - sold) * 10) / 10 });
    }
  }
  return records;
}

function demoSurplus(): SurplusPost[] {
  const today = new Date();
  const partners = ["City Rescue Mission", "Regional Food Bank of Oklahoma", "Homeless Alliance Day Shelter"];
  const donations: SurplusPost[] = Array.from({ length: 8 }, (_, i) => ({
    id: `demo-${i}`,
    createdAt: addDays(today, -(i * 4 + 1)).toISOString(),
    kind: "donate",
    items: [
      { name: "Mexican rice", quantity: 4 + (i % 3), unit: "lbs" },
      { name: "Carne asada", quantity: 3 + (i % 2), unit: "lbs" },
      { name: "Corn tortillas", quantity: 5, unit: "dozen" },
    ],
    estLbs: 13 + (i % 3) + (i % 2),
    pickupBy: "9:30 PM",
    status: "claimed",
    claimedBy: partners[i % partners.length],
  }));
  const compost: SurplusPost = {
    id: "demo-compost",
    createdAt: addDays(today, -3).toISOString(),
    kind: "compost",
    items: [{ name: "Vegetable scraps and spoiled produce", quantity: 22, unit: "lbs" }],
    estLbs: 22,
    pickupBy: "Friday AM",
    status: "claimed",
    claimedBy: "Red Dirt Compost Co.",
  };
  return [compost, ...donations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function demoEvents(): LocalEvent[] {
  const at = (n: number) => isoDate(addDays(new Date(), n));
  return [
    { id: "ev-thunder", date: at(1), name: "OKC Thunder home game", changePct: 20 },
    { id: "ev-ou", date: at(2), name: "OU home football game", changePct: 25 },
    { id: "ev-market", date: at(4), name: "Downtown farmers market", changePct: 10 },
    { id: "ev-holiday", date: at(6), name: "Holiday (many regulars out of town)", changePct: -20 },
  ];
}

export function demoDb(): Db {
  return {
    isDemo: true,
    profile: DEMO_PROFILE,
    menu: DEMO_MENU,
    records: demoRecords(),
    events: demoEvents(),
    surplus: demoSurplus(),
    website: null,
  };
}

export function emptyDb(): Db {
  return {
    isDemo: false,
    profile: { ...DEMO_PROFILE, name: "", ownerName: "", cuisine: "", address: "", phone: "", hours: "", description: "" },
    menu: [],
    records: [],
    events: [],
    surplus: [],
    website: null,
  };
}
