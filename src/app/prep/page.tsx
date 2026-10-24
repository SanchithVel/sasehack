"use client";

import { useEffect, useState } from "react";
import { CloudRain, Loader2, PartyPopper, Sparkles, Thermometer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import type { ItemForecast, Weather } from "@/lib/forecast";
import type { LocalEvent } from "@/lib/types";

type Forecast = {
  date: string;
  weekday: string;
  weather: Weather;
  events: LocalEvent[];
  items: ItemForecast[];
  summary: string;
};

export default function PrepPage() {
  const [data, setData] = useState<Forecast>();

  useEffect(() => {
    fetch("/api/forecast").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <>
        <PageHeader title="Tomorrow's prep" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Building your forecast…
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Prep for ${data.weekday}`} subtitle="Based on your sales history, local events, and the OKC forecast." />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="secondary">
          <Thermometer /> High {data.weather.highF}°F
        </Badge>
        <Badge variant="secondary">
          <CloudRain /> {data.weather.rainChance}% rain
        </Badge>
        {data.events.map((e) => (
          <Badge key={e.name}>
            <PartyPopper /> {e.name}
          </Badge>
        ))}
      </div>

      <Card className="mb-4 border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> What to do differently
          </CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-line text-sm">{data.summary}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended quantities</CardTitle>
          <CardDescription>Includes a 5% safety buffer so you don&apos;t sell out.</CardDescription>
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
  );
}
