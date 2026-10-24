import { MENU, menuItem } from "@/lib/data/business";
import { store } from "@/lib/store";
import { addDays, isoDate } from "@/lib/dates";

const LBS_PER_MEAL = 1.2; // Feeding America's standard conversion
const KG_CO2E_PER_KG_FOOD = 2.5; // rough estimate for food waste
const DEDUCTION_MULTIPLIER = 1.5; // rough enhanced-deduction estimate — not tax advice

/** Daily waste totals (lbs and $) for the trend chart. */
export function wasteByDay() {
  const days = new Map<string, { date: string; lbs: number; cost: number }>();
  for (const r of store.records) {
    const item = menuItem(r.itemId)!;
    const d = days.get(r.date) ?? { date: r.date, lbs: 0, cost: 0 };
    d.lbs += r.wasted * item.lbsPerUnit;
    d.cost += r.wasted * item.costPerUnit;
    days.set(r.date, d);
  }
  const today = isoDate(new Date());
  const todaysLogs = store.logs.filter((l) => l.date === today);
  if (todaysLogs.length) {
    days.set(today, {
      date: today,
      lbs: todaysLogs.reduce((s, l) => s + l.estLbs, 0),
      cost: todaysLogs.reduce((s, l) => {
        const item = l.itemId ? menuItem(l.itemId) : undefined;
        return s + (item ? (l.estLbs / item.lbsPerUnit) * item.costPerUnit : l.estLbs * 2);
      }, 0),
    });
  }
  return [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, lbs: Math.round(d.lbs * 10) / 10, cost: Math.round(d.cost) }));
}

/** Items ranked by $ wasted over the last `days` days. */
export function topWastedItems(days = 30) {
  const since = isoDate(addDays(new Date(), -days));
  return MENU.map((item) => {
    const recs = store.records.filter((r) => r.itemId === item.id && r.date >= since);
    const wasted = recs.reduce((s, r) => s + r.wasted, 0);
    const prepared = recs.reduce((s, r) => s + r.prepared, 0);
    return {
      id: item.id,
      name: item.name,
      wastedLbs: Math.round(wasted * item.lbsPerUnit),
      wastedCost: Math.round(wasted * item.costPerUnit),
      wasteRate: prepared ? Math.round((wasted / prepared) * 100) : 0,
    };
  }).sort((a, b) => b.wastedCost - a.wastedCost);
}

export function impactSummary() {
  const trend = wasteByDay();
  const avg = (xs: { lbs: number }[]) => xs.reduce((s, d) => s + d.lbs, 0) / Math.max(xs.length, 1);
  const before = avg(trend.slice(0, 14));
  const recent = avg(trend.slice(-7));

  const donated = store.surplus.filter((p) => p.status === "claimed");
  const donatedLbs = donated.reduce((s, p) => s + p.estLbs, 0);
  const avgCostPerLb = MENU.reduce((s, m) => s + m.costPerUnit / m.lbsPerUnit, 0) / MENU.length;
  const reducedLbsPerMonth = Math.max(0, before - recent) * 30;
  const savedLbs = donatedLbs + reducedLbsPerMonth;

  return {
    wasteReductionPct: before ? Math.round(((before - recent) / before) * 100) : 0,
    donatedLbs: Math.round(donatedLbs),
    mealsDonated: Math.round(donatedLbs / LBS_PER_MEAL),
    donations: donated.length,
    savedLbs: Math.round(savedLbs),
    co2eKg: Math.round(savedLbs * 0.4536 * KG_CO2E_PER_KG_FOOD),
    moneySavedPerMonth: Math.round(reducedLbsPerMonth * avgCostPerLb),
    estTaxDeduction: Math.round(donatedLbs * avgCostPerLb * DEDUCTION_MULTIPLIER),
  };
}
