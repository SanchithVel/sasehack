import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ClipboardList, Info, Leaf, Scale, Settings, Utensils, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
        <PageHeader title="Welcome" subtitle="Set up your business to start tracking waste and impact." />
        <Card>
          <CardContent className="space-y-3 text-sm">
            <p>Three steps to accurate numbers:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Add your business details and the menu items you prep each day, with cost and price.</li>
              <li>At close each day, log what you prepped, sold, and threw out (a photo can fill in the waste).</li>
              <li>Post leftovers on the Surplus page so nearby shelters and food banks can pick them up.</li>
            </ol>
            <Link href="/setup" className={buttonVariants()}>
              <Settings /> Go to setup
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
      label: "Wasted (30 days)",
      value: `$${impact.wasteCost30.toLocaleString()}`,
      sub: `${impact.wasteLbs30} lbs thrown out`,
      icon: Scale,
    },
    {
      label: "Waste reduced",
      value: impact.wasteReductionPct === null ? "—" : `${impact.wasteReductionPct}%`,
      sub:
        impact.moneySavedPerMonth === null
          ? `Needs 14 logged days (${impact.daysLogged} so far)`
          : `≈ $${impact.moneySavedPerMonth}/mo saved on food cost`,
      icon: Scale,
    },
    {
      label: "Meals donated",
      value: impact.mealsDonated.toLocaleString(),
      sub: `${impact.donatedLbs} lbs in ${impact.donations} pickups`,
      icon: Utensils,
    },
    {
      label: "Est. tax deduction",
      value: `$${impact.estTaxDeduction.toLocaleString()}`,
      sub: `${impact.co2eKg} kg CO₂e avoided`,
      icon: Wallet,
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 md:mb-0">
        <PageHeader
          title={db.profile.name || "Your dashboard"}
          subtitle={`${db.profile.city}, OK · ${impact.daysLogged} days logged`}
        />
        <Link href="/log" className={buttonVariants()}>
          <ClipboardList /> Log today
        </Link>
      </div>

      {db.isDemo && (
        <Card className="mb-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30" size="sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              <Badge variant="outline" className="mr-2">
                Demo data
              </Badge>
              These numbers come from a sample taco shop with 35 days of generated logs.
            </span>
            <Link href="/setup" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Use my own business
            </Link>
          </CardContent>
        </Card>
      )}

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
            <CardDescription>Pounds thrown out per logged day, from your daily log.</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.length ? (
              <WasteTrendChart data={trend} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">Log your first day to see the trend.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most wasted (30 days)</CardTitle>
            <CardDescription>Ranked by what it cost you.</CardDescription>
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

      <Card className="mt-4" size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-4" /> How these numbers are calculated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            <li>
              <strong>Wasted $ and lbs</strong>: the &quot;thrown out&quot; amounts in your daily log × each item&apos;s cost and weight from Setup.
            </li>
            <li>
              <strong>Waste reduced</strong>: average lbs/day over your first 7 logged days vs. your latest 7. Savings = that drop × 30 days × your
              average cost per lb.
            </li>
            <li>
              <strong>Meals donated</strong>: lbs from claimed donation pickups ÷ {LBS_PER_MEAL} lbs per meal (Feeding America&apos;s standard).
            </li>
            <li>
              <strong>Tax deduction</strong>: estimate of the enhanced deduction for donated food (lesser of cost + half the markup, or 2× cost),
              using your menu&apos;s cost and price. Not tax advice; confirm with your accountant.
            </li>
            <li>
              <strong>CO₂e avoided</strong>: lbs donated, composted, or no longer over-prepped × {KG_CO2E_PER_KG_FOOD} kg CO₂e per kg of food kept
              out of landfill (a rough estimate).
            </li>
          </ul>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Leaf className="size-3" /> {impact.compostLbs} lbs composted so far.
          </div>
        </CardContent>
      </Card>
    </>
  );
}
