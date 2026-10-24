import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Camera, Leaf, Scale, Utensils, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { WasteTrendChart } from "@/components/waste-trend-chart";
import { BUSINESS } from "@/lib/data/business";
import { impactSummary, topWastedItems, wasteByDay } from "@/lib/impact";

export default function Dashboard() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 md:mb-0">
        <PageHeader title={`Good evening, ${BUSINESS.name}`} subtitle="Your waste, your impact, and what to do next." />
        <Link href="/log" className={buttonVariants()}>
          <Camera /> Log tonight&apos;s waste
        </Link>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  // Reads the in-memory store, so render on every request.
  await connection();
  const impact = impactSummary();
  const trend = wasteByDay();
  const top = topWastedItems(30).slice(0, 5);

  const stats = [
    { label: "Meals donated", value: impact.mealsDonated.toLocaleString(), sub: `${impact.donatedLbs} lbs in ${impact.donations} pickups`, icon: Utensils },
    { label: "Waste reduced", value: `${impact.wasteReductionPct}%`, sub: "last 7 days vs. before", icon: Scale },
    { label: "CO₂e avoided", value: `${impact.co2eKg} kg`, sub: `${impact.savedLbs} lbs kept out of landfill`, icon: Leaf },
    { label: "Est. tax deduction", value: `$${impact.estTaxDeduction}`, sub: `+ $${impact.moneySavedPerMonth}/mo saved on prep`, icon: Wallet },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} size="sm">
            <CardContent className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-4 text-primary" /> {label}
              </div>
              <div className="text-2xl font-semibold">{value}</div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily food waste</CardTitle>
            <CardDescription>Pounds thrown out per day. Drops once prep follows the forecast.</CardDescription>
          </CardHeader>
          <CardContent>
            <WasteTrendChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most wasted (30 days)</CardTitle>
            <CardDescription>Where the money goes in the trash.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {top.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.wastedLbs} lbs wasted</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${item.wastedCost}</div>
                  <Badge variant={item.wasteRate > 15 ? "destructive" : "secondary"}>{item.wasteRate}% waste</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
