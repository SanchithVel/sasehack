import type { LocalEvent } from "@/lib/types";
import { addDays, isoDate } from "@/lib/dates";

// Mock event calendar, generated relative to today so the demo always has
// something coming up. Swap in a real schedule if you have time.
export function upcomingEvents(today = new Date()): LocalEvent[] {
  const at = (n: number) => isoDate(addDays(today, n));
  return [
    { date: at(1), name: "OKC Thunder home game", multipliers: { protein: 1.25, side: 1.1, bread: 1.2 } },
    { date: at(2), name: "OU home football game (Norman)", multipliers: { protein: 1.3, bread: 1.25, fresh: 1.15 } },
    { date: at(4), name: "Downtown farmers market", multipliers: { fresh: 1.2 } },
    { date: at(6), name: "Holiday weekend", multipliers: { protein: 0.8, side: 0.8, bread: 0.8, fresh: 0.8 } },
  ];
}
