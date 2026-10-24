import type { Db } from "@/lib/types";
import { menuItem } from "@/lib/db";
import { addDays, isoDate } from "@/lib/dates";

export const LBS_PER_MEAL = 1.2; // Feeding America's standard conversion
export const KG_CO2E_PER_KG_FOOD = 2.5; // rough estimate for food waste in landfill
/** Logged days needed before we compare "before" vs "recent" waste. */
const MIN_DAYS_FOR_TREND = 14;

/** Daily waste totals (lbs and $) from the owner's daily logs. */
export function wasteByDay(db: Db) {
  const days = new Map<string, { date: string; lbs: number; cost: number }>();
  for (const r of db.records) {
    const item = menuItem(db, r.itemId);
    if (!item) continue;
    const d = days.get(r.date) ?? { date: r.date, lbs: 0, cost: 0 };
    d.lbs += r.wasted * item.lbsPerUnit;
    d.cost += r.wasted * item.costPerUnit;
    days.set(r.date, d);
  }
  return [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, lbs: Math.round(d.lbs * 10) / 10, cost: Math.round(d.cost) }));
}

/** Menu items ranked by $ wasted over the last `days` days. */
export function topWastedItems(db: Db, days = 30) {
  const since = isoDate(addDays(new Date(), -days));
  return db.menu
    .map((item) => {
      const recs = db.records.filter((r) => r.itemId === item.id && r.date >= since);
      const wasted = recs.reduce((s, r) => s + r.wasted, 0);
      const prepared = recs.reduce((s, r) => s + r.prepared, 0);
      return {
        id: item.id,
        name: item.name,
        wastedLbs: Math.round(wasted * item.lbsPerUnit),
        wastedCost: Math.round(wasted * item.costPerUnit),
        wasteRate: prepared ? Math.round((wasted / prepared) * 100) : 0,
      };
    })
    .sort((a, b) => b.wastedCost - a.wastedCost);
}

/** Average cost and sale price per lb across the menu (weights each item equally). */
function perLb(db: Db) {
  if (!db.menu.length) return { cost: 0, price: 0 };
  return {
    cost: db.menu.reduce((s, m) => s + m.costPerUnit / m.lbsPerUnit, 0) / db.menu.length,
    price: db.menu.reduce((s, m) => s + m.pricePerUnit / m.lbsPerUnit, 0) / db.menu.length,
  };
}

/**
 * Enhanced deduction for donated food inventory (IRC §170(e)(3)), simplified:
 * the lesser of cost basis + half the markup, or twice the cost basis.
 * An estimate only — not tax advice.
 */
function estimateDeduction(lbs: number, costPerLb: number, pricePerLb: number) {
  const basis = lbs * costPerLb;
  const fairValue = lbs * pricePerLb;
  return Math.min(basis + Math.max(0, fairValue - basis) / 2, basis * 2);
}

export function impactSummary(db: Db) {
  const trend = wasteByDay(db);
  const avg = (xs: { lbs: number }[]) => xs.reduce((s, d) => s + d.lbs, 0) / Math.max(xs.length, 1);
  const hasTrend = trend.length >= MIN_DAYS_FOR_TREND;
  const before = hasTrend ? avg(trend.slice(0, 7)) : 0;
  const recent = hasTrend ? avg(trend.slice(-7)) : 0;
  const reducedLbsPerDay = Math.max(0, before - recent);

  const done = db.tickets.filter((t) => t.status === "completed");
  const donatedLbs = done.filter((t) => t.kind === "donate").reduce((s, t) => s + t.estLbs, 0);
  const compostLbs = done.filter((t) => t.kind === "compost").reduce((s, t) => s + t.estLbs, 0);

  const last30 = trend.filter((d) => d.date >= isoDate(addDays(new Date(), -30)));
  const { cost: costPerLb, price: pricePerLb } = perLb(db);
  const divertedLbs = donatedLbs + compostLbs + reducedLbsPerDay * 30;

  return {
    daysLogged: trend.length,
    wasteLbs30: Math.round(last30.reduce((s, d) => s + d.lbs, 0)),
    wasteCost30: Math.round(last30.reduce((s, d) => s + d.cost, 0)),
    /** null until there are enough logged days to compare. */
    wasteReductionPct: hasTrend && before ? Math.round(((before - recent) / before) * 100) : null,
    moneySavedPerMonth: hasTrend ? Math.round(reducedLbsPerDay * 30 * costPerLb) : null,
    donatedLbs: Math.round(donatedLbs),
    mealsDonated: Math.round(donatedLbs / LBS_PER_MEAL),
    donations: done.filter((t) => t.kind === "donate").length,
    compostLbs: Math.round(compostLbs),
    divertedLbs: Math.round(divertedLbs),
    co2eKg: Math.round(divertedLbs * 0.4536 * KG_CO2E_PER_KG_FOOD),
    estTaxDeduction: Math.round(estimateDeduction(donatedLbs, costPerLb, pricePerLb)),
  };
}
