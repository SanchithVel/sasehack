"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CloudRain, Loader2, PartyPopper, PiggyBank, Sparkles, Thermometer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { weekday } from "@/lib/dates";
import type { ItemForecast, Weather } from "@/lib/forecast";
import type { LocalEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Forecast = {
  date: string;
  weekday: string;
  weather: Weather | null;
  events: LocalEvent[];
  items: ItemForecast[];
  totalSavings: number;
  summary: string;
  nextDays: string[];
};

export default function PrepPage() {
  const [days, setDays] = useState<string[]>([]);
  const [date, setDate] = useState<string>(); // undefined = tomorrow (server decides)
  const [data, setData] = useState<Forecast>();

  useEffect(() => {
    api<Forecast>(`/api/forecast${date ? `?date=${date}` : ""}`).then((f) => {
      setData(f);
      setDays(f.nextDays);
    });
  }, [date]);

  function pick(d: string) {
    setData(undefined);
    setDate(d);
  }

  return (
    <>
      <PageHeader title="Prep forecast" subtitle="Built from your daily logs, your event calendar, and the local weather forecast." />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {days.map((d, i) => (
          <button
            key={d}
            onClick={() => pick(d)}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-sm",
              d === (date ?? days[0]) ?"border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
            )}
          >
            {i === 0 ? "Tomorrow" : weekday(d).slice(0, 3)} <span className="opacity-70">{d.slice(5)}</span>
          </button>
        ))}
      </div>

      {!data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Building your forecast…
        </div>
      ) : data.items.length === 0 ? (
        <Card>
          <CardContent className="text-sm">
            Add menu items on the{" "}
            <Link href="/setup" className="font-medium text-primary underline">
              Setup page
            </Link>{" "}
            to get a forecast.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {data.weather ? (
              <>
                <Badge variant="secondary">
                  <Thermometer /> High {data.weather.highF}°F
                </Badge>
                <Badge variant="secondary">
                  <CloudRain /> {data.weather.rainChance}% rain
                </Badge>
              </>
            ) : (
              <Badge variant="outline">Weather unavailable</Badge>
            )}
            {data.events.map((e) => (
              <Badge key={e.id}>
                <PartyPopper /> {e.name} ({e.changePct > 0 ? "+" : ""}
                {e.changePct}%)
              </Badge>
            ))}
            {data.totalSavings > 0 && (
              <Badge variant="outline" className="border-primary text-primary">
                <PiggyBank /> Saves ≈ ${data.totalSavings} vs usual prep
              </Badge>
            )}
          </div>

          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> What to do differently on {data.weekday}
              </CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-line text-sm">{data.summary}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended quantities</CardTitle>
              <CardDescription>Includes a 5% safety buffer so you don&apos;t run out.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {data.items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.reasons.join(" · ")}</div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-xs text-muted-foreground">
                      usual {item.usualPrep} {item.unit}
                    </div>
                    <div className="text-lg font-semibold">
                      {item.recommendedPrep} {item.unit}
                    </div>
                    <Badge variant={item.changePct < 0 ? "secondary" : "default"} className="w-14">
                      {item.changePct > 0 ? "+" : ""}
                      {item.changePct}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
