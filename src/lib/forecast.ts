import { BUSINESS, MENU } from "@/lib/data/business";
import { upcomingEvents } from "@/lib/data/events";
import { store, DAY_FACTOR } from "@/lib/store";
import { addDays, isoDate, weekday } from "@/lib/dates";

export type Weather = { highF: number; rainChance: number; source: "open-meteo" | "fallback" };

export type ItemForecast = {
  id: string;
  name: string;
  unit: string;
  usualPrep: number;
  expectedDemand: number;
  recommendedPrep: number;
  changePct: number;
  reasons: string[];
};

const SAFETY_BUFFER = 1.05;

/** Tomorrow's weather in OKC from Open-Meteo (free, no key). */
export async function getWeather(date: string): Promise<Weather> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${BUSINESS.lat}&longitude=${BUSINESS.lng}` +
      `&daily=temperature_2m_max,precipitation_probability_max&temperature_unit=fahrenheit` +
      `&timezone=America%2FChicago&start_date=${date}&end_date=${date}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const json = await res.json();
    return {
      highF: Math.round(json.daily.temperature_2m_max[0]),
      rainChance: json.daily.precipitation_probability_max[0] ?? 0,
      source: "open-meteo",
    };
  } catch {
    return { highF: 72, rainChance: 20, source: "fallback" };
  }
}

export async function forecastTomorrow() {
  const target = isoDate(addDays(new Date(), 1));
  const targetDow = new Date(`${target}T12:00:00`).getDay();
  const events = upcomingEvents().filter((e) => e.date === target);
  const weather = await getWeather(target);

  const items: ItemForecast[] = MENU.map((item) => {
    // Baseline: average sold on the same weekday over the history.
    const sameDay = store.records.filter(
      (r) => r.itemId === item.id && new Date(`${r.date}T12:00:00`).getDay() === targetDow,
    );
    let demand = sameDay.length
      ? sameDay.reduce((s, r) => s + r.sold, 0) / sameDay.length
      : item.usualPrep * DAY_FACTOR[targetDow];
    const reasons = [`Typical ${weekday(target)} sales: ${demand.toFixed(1)} ${item.unit}`];

    for (const e of events) {
      const m = e.multipliers[item.category];
      if (m) {
        demand *= m;
        reasons.push(`${e.name}: ${m > 1 ? "+" : ""}${Math.round((m - 1) * 100)}%`);
      }
    }
    if (weather.rainChance >= 60) {
      demand *= 0.85;
      reasons.push(`${weather.rainChance}% chance of rain: -15% foot traffic`);
    }
    if (weather.highF >= 95 && item.category !== "fresh") {
      demand *= 0.92;
      reasons.push(`${weather.highF}°F heat: -8% on hot food`);
    }

    const recommendedPrep = Math.ceil(demand * SAFETY_BUFFER);
    return {
      id: item.id,
      name: item.name,
      unit: item.unit,
      usualPrep: item.usualPrep,
      expectedDemand: Math.round(demand * 10) / 10,
      recommendedPrep,
      changePct: Math.round(((recommendedPrep - item.usualPrep) / item.usualPrep) * 100),
      reasons,
    };
  });

  return { date: target, weekday: weekday(target), weather, events, items };
}
