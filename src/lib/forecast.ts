import type { Category, Db } from "@/lib/types";
import { addDays, isoDate, weekday } from "@/lib/dates";

export type Weather = { highF: number; rainChance: number; source: "open-meteo" | "unavailable" };

export type ItemForecast = {
  id: string;
  name: string;
  unit: string;
  usualPrep: number;
  expectedDemand: number;
  recommendedPrep: number;
  changePct: number;
  /** $ of ingredients saved vs. usual prep (0 if prepping more). */
  savings: number;
  reasons: string[];
};

const SAFETY_BUFFER = 1.05;
const WEEKS_OF_HISTORY = 4;
const HOT_FOOD: Category[] = ["main", "side"];

/** Daily weather from Open-Meteo (free, no key). Forecasts go ~16 days out. */
export async function getWeather(lat: number, lng: number, date: string): Promise<Weather | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,precipitation_probability_max&temperature_unit=fahrenheit` +
      `&timezone=America%2FChicago&start_date=${date}&end_date=${date}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      highF: Math.round(json.daily.temperature_2m_max[0]),
      rainChance: json.daily.precipitation_probability_max[0] ?? 0,
      source: "open-meteo",
    };
  } catch {
    return null;
  }
}

export async function forecastFor(db: Db, target = isoDate(addDays(new Date(), 1))) {
  const dow = new Date(`${target}T12:00:00`).getDay();
  const dayName = weekday(target);
  const events = db.events.filter((e) => e.date === target);
  const weather = await getWeather(db.profile.lat, db.profile.lng, target);

  const items: ItemForecast[] = db.menu.map((item) => {
    const reasons: string[] = [];
    // Baseline: what actually sold on the same weekday over the last few weeks.
    const sameDay = db.records
      .filter((r) => r.itemId === item.id && r.date < target && new Date(`${r.date}T12:00:00`).getDay() === dow)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, WEEKS_OF_HISTORY);

    let demand: number;
    if (sameDay.length) {
      demand = sameDay.reduce((s, r) => s + r.sold, 0) / sameDay.length;
      reasons.push(`Avg sold on last ${sameDay.length} ${dayName}s: ${demand.toFixed(1)} ${item.unit}`);
      // If it sold out, true demand was higher than what was sold.
      const soldOut = sameDay.filter((r) => r.sold >= r.prepared).length;
      if (soldOut) {
        demand *= 1 + 0.1 * (soldOut / sameDay.length);
        reasons.push(`Sold out ${soldOut} of ${sameDay.length} times: +${Math.round((10 * soldOut) / sameDay.length)}%`);
      }
    } else {
      demand = item.usualPrep / SAFETY_BUFFER;
      reasons.push(`No ${dayName} logs yet, so this uses your usual prep`);
    }

    for (const e of events) {
      demand *= 1 + e.changePct / 100;
      reasons.push(`${e.name}: ${e.changePct > 0 ? "+" : ""}${e.changePct}%`);
    }
    if (weather && weather.rainChance >= 60) {
      demand *= 0.85;
      reasons.push(`${weather.rainChance}% chance of rain: -15%`);
    }
    if (weather && weather.highF >= 95) {
      const m = item.category === "drink" ? 1.15 : HOT_FOOD.includes(item.category) ? 0.92 : 1;
      if (m !== 1) {
        demand *= m;
        reasons.push(`${weather.highF}°F heat: ${m > 1 ? "+15%" : "-8%"}`);
      }
    }

    // Round up, but don't add a whole unit for a sliver (15.02 → 15, 15.3 → 16).
    const recommendedPrep = Math.ceil(demand * SAFETY_BUFFER - 0.1);
    return {
      id: item.id,
      name: item.name,
      unit: item.unit,
      usualPrep: item.usualPrep,
      expectedDemand: Math.round(demand * 10) / 10,
      recommendedPrep,
      changePct: item.usualPrep ? Math.round(((recommendedPrep - item.usualPrep) / item.usualPrep) * 100) : 0,
      savings: Math.round(Math.max(0, item.usualPrep - recommendedPrep) * item.costPerUnit),
      reasons,
    };
  });

  return {
    date: target,
    weekday: dayName,
    weather,
    events,
    items,
    totalSavings: items.reduce((s, i) => s + i.savings, 0),
  };
}
