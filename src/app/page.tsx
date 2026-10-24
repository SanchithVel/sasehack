import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ClipboardList, HandHeart, Leaf, Settings, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { PageHeader } from "@/components/page-header";
import { WasteTrendChart } from "@/components/waste-trend-chart";
import { getDb } from "@/lib/db";
import { impactSummary, KG_CO2E_PER_KG_FOOD, LBS_PER_MEAL, topWastedItems, wasteByDay } from "@/lib/impact";

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  // Reads the database, so render on every request.
  await connection();
  const db = getDb();

  if (!db.menu.length) {
    return (
      <>
        <PageHeader title="Welcome" />
        <Card>
          <CardContent className="space-y-4">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Add your business and menu in Setup.</li>
              <li>Log what you prepped, sold, and threw out each day.</li>
              <li>Send leftovers to local food banks and shelters.</li>
            </ol>
            <Link href="/setup" className={buttonVariants()}>
              <Settings /> Go to Setup
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  const impact = impactSummary(db);
  const trend = wasteByDay(db);
  const top = topWastedItems(db, 30).slice(0, 5);

  const stats = [
    {
      label: "Wasted this month",
      value: `$${impact.wasteCost30.toLocaleString()}`,
      sub: `${impact.wasteLbs30} lbs`,
      icon: Wallet,
      info: "From your daily log: \"thrown out\" amounts over the last 30 days × each item's cost and weight from Setup.",
    },
    {
      label: "Waste reduced",
      value: impact.wasteReductionPct === null ? "—" : `${impact.wasteReductionPct}%`,
      sub: impact.moneySavedPerMonth === null ? `${impact.daysLogged}/14 days logged` : `$${impact.moneySavedPerMonth}/mo saved`,
      icon: TrendingDown,
      info: "Average waste per day in your first 7 logged days vs. your latest 7. Savings = that drop × 30 days × your average cost per lb. Needs 14 logged days.",
    },
    {
      label: "Meals donated",
      value: impact.mealsDonated.toLocaleString(),
      sub: `${impact.donatedLbs} lbs donated`,
      icon: HandHeart,
      info: `Pounds from completed donation tickets ÷ ${LBS_PER_MEAL} lbs per meal (Feeding America's standard).`,
    },
    {
      label: "Tax deduction",
      value: `$${impact.estTaxDeduction.toLocaleString()}`,
      sub: `${impact.co2eKg} kg CO₂ avoided`,
      icon: Leaf,
      info: `Estimated enhanced deduction for donated food: the lesser of cost + half the markup, or 2× cost, using your menu's cost and price. Not tax advice. CO₂: lbs donated, composted, or no longer over-prepped × ${KG_CO2E_PER_KG_FOOD} kg CO₂e per kg (rough estimate).`,
    },
  ];

  return (
    <>
      <PageHeader
        title={db.profile.name || "Dashboard"}
        action={
          <Link href="/log" className={buttonVariants()}>
            <ClipboardList /> Log today
          </Link>
        }
      />

      {db.isDemo && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span>You&apos;re viewing sample data.</span>
          <Link href="/setup" className="font-medium underline underline-offset-4">
            Use my own business
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, info }, i) => (
          <Card key={label}>
            <CardContent className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4 text-primary" />
                {label}
                <InfoTip align={i % 2 ? "end" : "start"} className="ml-auto">
                  {info}
                </InfoTip>
              </div>
              <div className="text-3xl font-semibold tracking-tight">{value}</div>
              <div className="text-sm text-muted-foreground">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily waste (lbs)</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length ? (
              <WasteTrendChart data={trend} />
            ) : (
              <p className="py-16 text-center text-muted-foreground">Log your first day to see this chart.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Most wasted
              <InfoTip align="end">Last 30 days, ranked by what the waste cost you. The % is how much of what you prepped got thrown out.</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {top.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.wastedLbs} lbs</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.wasteRate > 15 ? "destructive" : "secondary"}>{item.wasteRate}%</Badge>
                  <span className="w-14 text-right font-medium">${item.wastedCost}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
