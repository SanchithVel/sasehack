"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BellRing, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { PARTNER_LABELS, PARTNERS } from "@/lib/data/partners";
import type { Partner, SurplusPost } from "@/lib/types";
import { cn } from "@/lib/utils";

const PartnerMap = dynamic(() => import("@/components/partner-map"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-lg bg-muted" />,
});

type Row = { name: string; quantity: number; unit: string };
const DONATION_TYPES: Partner["type"][] = ["food_bank", "shelter", "pantry"];

export default function SurplusPage() {
  const [posts, setPosts] = useState<SurplusPost[]>([]);
  const [rows, setRows] = useState<Row[]>([{ name: "", quantity: 1, unit: "lbs" }]);
  const [pickupBy, setPickupBy] = useState("9:30 PM");
  const [filter, setFilter] = useState<Partner["type"] | "all">("all");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/surplus").then((r) => r.json()).then(setPosts);
  }, []);

  async function post() {
    const items = rows.filter((r) => r.name.trim());
    if (!items.length) return;
    const estLbs = items.reduce((s, r) => s + (r.unit === "dozen" ? r.quantity * 1.1 : r.quantity), 0);
    const res = await fetch("/api/surplus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, estLbs: Math.round(estLbs), pickupBy }),
    });
    const created: SurplusPost = await res.json();
    setPosts((p) => [created, ...p]);
    setRows([{ name: "", quantity: 1, unit: "lbs" }]);
    setSent(true);
  }

  // Demo shortcut: claim as the nearest shelter, as if they tapped the SMS link.
  async function claim(id: string) {
    const res = await fetch("/api/surplus", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, partnerName: "City Rescue Mission" }),
    });
    const updated: SurplusPost = await res.json();
    setPosts((p) => p.map((x) => (x.id === id ? updated : x)));
  }

  const nearby = PARTNERS.filter((p) => DONATION_TYPES.includes(p.type));
  const shown = PARTNERS.filter((p) => filter === "all" || p.type === filter);

  return (
    <>
      <PageHeader title="Surplus & partners" subtitle="Turn tonight's extra food into meals, and scraps into compost." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>I have surplus</CardTitle>
            <CardDescription>Alerts {nearby.length} nearby food banks, shelters, and pantries. First to claim picks it up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_4.5rem_5rem_auto] gap-2">
                <Input
                  placeholder="e.g. Mexican rice"
                  value={row.name}
                  onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
                />
                <Input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, quantity: Number(e.target.value) } : r)))}
                />
                <select
                  className="rounded-lg border bg-background px-2 text-sm"
                  value={row.unit}
                  onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, unit: e.target.value } : r)))}
                >
                  <option>lbs</option>
                  <option>dozen</option>
                  <option>trays</option>
                </select>
                <Button variant="ghost" size="icon" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setRows([...rows, { name: "", quantity: 1, unit: "lbs" }])}>
              <Plus /> Add item
            </Button>
            <div className="flex items-center gap-2 pt-2 text-sm">
              Pickup by <Input className="w-28" value={pickupBy} onChange={(e) => setPickupBy(e.target.value)} />
            </div>
            <Button className="w-full" onClick={post}>
              <BellRing /> Notify partners
            </Button>
            {sent && <p className="text-sm text-primary">Sent! Partners were notified by text (simulated).</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pickups</CardTitle>
            <CardDescription>Open posts and completed donations.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 space-y-3 overflow-y-auto">
            {posts.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-2 rounded-lg border p-3 text-sm">
                <div>
                  <div className="font-medium">{p.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(", ")}</div>
                  <div className="text-xs text-muted-foreground">
                    ~{p.estLbs} lbs · {new Date(p.createdAt).toLocaleDateString()} · pickup by {p.pickupBy}
                  </div>
                </div>
                {p.status === "open" ? (
                  <Button size="sm" variant="outline" onClick={() => claim(p.id)}>
                    Simulate claim
                  </Button>
                ) : (
                  <Badge variant="secondary">Claimed by {p.claimedBy}</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Local partner network</CardTitle>
          <CardDescription>Donation partners, farms and compost for scraps, and Oklahoma suppliers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", ...Object.keys(PARTNER_LABELS)] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t as Partner["type"] | "all")}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  filter === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {t === "all" ? "All" : PARTNER_LABELS[t as Partner["type"]]}
              </button>
            ))}
          </div>
          <PartnerMap partners={shown} />
          <div className="grid gap-3 sm:grid-cols-2">
            {shown.map((p) => (
              <div key={p.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="outline">{PARTNER_LABELS[p.type]}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.city}
                  {p.rating && (
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <Star className="size-3 fill-current" /> {p.rating}
                    </span>
                  )}
                  {p.sample && <span className="ml-2 italic">sample</span>}
                </div>
                <p className="mt-1 text-xs">{p.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
