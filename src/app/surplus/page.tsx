"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BellRing, Check, ClipboardList, Copy, HandHeart, Loader2, Mail, Plus, Recycle, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { Select } from "@/components/form";
import { api } from "@/lib/api";
import { isoDate } from "@/lib/dates";
import { COMPOST_TYPES, DONATION_TYPES, milesBetween, PARTNER_LABELS, PARTNERS } from "@/lib/data/partners";
import type { DailyRecord, MenuItem, Partner, Profile, SurplusPost } from "@/lib/types";
import { cn } from "@/lib/utils";

const PartnerMap = dynamic(() => import("@/components/partner-map"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-lg bg-muted" />,
});

type Row = { name: string; quantity: number; unit: string };
type Kind = SurplusPost["kind"];
const LBS_PER: Record<string, number> = { lbs: 1, dozen: 1.1, trays: 9, servings: 0.75, pieces: 0.25, gallons: 8.3 };
const emptyRow = (): Row => ({ name: "", quantity: 1, unit: "lbs" });

export default function SurplusPage() {
  const [posts, setPosts] = useState<SurplusPost[]>([]);
  const [profile, setProfile] = useState<Profile>();
  const [kind, setKind] = useState<Kind>("donate");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [pickupBy, setPickupBy] = useState("9:30 PM");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState<Partner["type"] | "all">("all");
  const [sort, setSort] = useState<"distance" | "rating">("distance");
  const [drafts, setDrafts] = useState<Record<string, { loading: boolean; text?: string; usedAi?: boolean }>>({});
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api<{ posts: SurplusPost[]; profile: Profile }>("/api/surplus").then((d) => {
      setPosts(d.posts);
      setProfile(d.profile);
    });
  }, []);

  /** Pre-fill from today's daily log: everything marked "thrown out". */
  async function fillFromLog() {
    const d = await api<{ menu: MenuItem[]; entries: DailyRecord[] }>(`/api/records?date=${isoDate(new Date())}`);
    const fromLog = d.entries
      .filter((e) => e.wasted > 0)
      .map((e) => {
        const m = d.menu.find((x) => x.id === e.itemId)!;
        return { name: m.name, quantity: e.wasted, unit: m.unit };
      });
    if (fromLog.length) setRows(fromLog);
    else setStatus("Nothing marked as thrown out in today's log yet.");
  }

  async function post() {
    const items = rows.filter((r) => r.name.trim() && r.quantity > 0);
    if (!items.length) return setStatus("Add at least one item.");
    const estLbs = Math.round(items.reduce((s, r) => s + r.quantity * (LBS_PER[r.unit] ?? 1), 0));
    const created = await api<SurplusPost>("/api/surplus", { kind, items, estLbs, pickupBy });
    setPosts((p) => [created, ...p]);
    setRows([emptyRow()]);
    const count = PARTNERS.filter((p) => (kind === "donate" ? DONATION_TYPES : COMPOST_TYPES).includes(p.type)).length;
    setStatus(`Posted. ${count} partners notified by text (simulated).`);
  }

  async function claim(id: string) {
    const updated = await api<SurplusPost>("/api/surplus", { id }, "PATCH");
    setPosts((p) => p.map((x) => (x.id === id ? updated : x)));
  }

  async function draft(p: Partner) {
    setDrafts((d) => ({ ...d, [p.id]: { loading: true } }));
    const res = await api<{ message: string; usedAi: boolean }>("/api/draft-message", { partnerId: p.id });
    setDrafts((d) => ({ ...d, [p.id]: { loading: false, text: res.message, usedAi: res.usedAi } }));
  }

  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1500);
  }

  const here = profile ?? { lat: 35.4676, lng: -97.5164, name: "" };
  const shown = PARTNERS.filter((p) => filter === "all" || p.type === filter)
    .map((p) => ({ ...p, miles: milesBetween(here, p) }))
    .sort((a, b) => (sort === "distance" ? a.miles - b.miles : (b.rating ?? 0) - (a.rating ?? 0)));

  return (
    <>
      <PageHeader title="Surplus & partners" subtitle="Turn extra food into meals, scraps into compost, and find local suppliers." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Post leftovers</CardTitle>
            <CardDescription>
              {kind === "donate"
                ? "Nearby food banks, shelters, and pantries get a text. First to claim picks it up."
                : "Compost services and farms near you get a pickup request for scraps."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {(["donate", "compost"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border py-2 text-sm",
                    kind === k ? "border-primary bg-primary/10 font-medium text-primary" : "hover:bg-muted",
                  )}
                >
                  {k === "donate" ? <HandHeart className="size-4" /> : <Recycle className="size-4" />}
                  {k === "donate" ? "Donate food" : "Compost scraps"}
                </button>
              ))}
            </div>
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_4.5rem_5.5rem_auto] gap-2">
                <Input
                  placeholder={kind === "donate" ? "e.g. Mexican rice" : "e.g. Vegetable scraps"}
                  value={row.name}
                  onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
                />
                <Input
                  type="number"
                  min={0}
                  value={row.quantity}
                  onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, quantity: Number(e.target.value) } : r)))}
                />
                <Select value={row.unit} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, unit: e.target.value } : r)))}>
                  {Object.keys(LBS_PER).map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </Select>
                <Button variant="ghost" size="icon" aria-label="Remove row" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setRows([...rows, emptyRow()])}>
                <Plus /> Add item
              </Button>
              <Button variant="outline" size="sm" onClick={fillFromLog}>
                <ClipboardList /> Fill from today&apos;s log
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-2 text-sm">
              Pickup by <Input className="w-32" value={pickupBy} onChange={(e) => setPickupBy(e.target.value)} />
            </div>
            <Button className="w-full" onClick={post}>
              <BellRing /> Notify {kind === "donate" ? "donation" : "compost"} partners
            </Button>
            {status && <p className="text-sm text-primary">{status}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pickups</CardTitle>
            <CardDescription>Open posts and completed pickups. Claimed donations count toward your impact.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[26rem] space-y-3 overflow-y-auto">
            {posts.length === 0 && <p className="text-sm text-muted-foreground">No pickups yet.</p>}
            {posts.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-2 rounded-lg border p-3 text-sm">
                <div>
                  <div className="flex items-center gap-1 font-medium">
                    {p.kind === "donate" ? <HandHeart className="size-3.5 text-primary" /> : <Recycle className="size-3.5 text-amber-700" />}
                    {p.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(", ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ~{p.estLbs} lbs · {new Date(p.createdAt).toLocaleDateString()} · pickup by {p.pickupBy}
                  </div>
                </div>
                {p.status === "open" ? (
                  <Button size="sm" variant="outline" onClick={() => claim(p.id)}>
                    Simulate claim
                  </Button>
                ) : (
                  <Badge variant="secondary" className="h-auto whitespace-normal text-right">
                    Claimed by {p.claimedBy}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Local partner network</CardTitle>
          <CardDescription>
            Donation partners, compost and farms for scraps, and Oklahoma meat and produce suppliers. Draft an intro email in one click.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", ...Object.keys(PARTNER_LABELS)] as (Partner["type"] | "all")[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  filter === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {t === "all" ? "All" : PARTNER_LABELS[t]}
              </button>
            ))}
            <Select className="ml-auto w-36" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="distance">Nearest first</option>
              <option value="rating">Top rated</option>
            </Select>
          </div>
          <PartnerMap center={{ ...here, name: profile?.name ?? "" }} partners={shown} />
          <div className="grid gap-3 sm:grid-cols-2">
            {shown.map((p) => {
              const d = drafts[p.id];
              return (
                <div key={p.id} className="flex flex-col rounded-lg border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{p.name}</span>
                    <Badge variant="outline">{PARTNER_LABELS[p.type]}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>
                      {p.city} · {p.miles.toFixed(1)} mi
                    </span>
                    {p.rating && (
                      <span className="inline-flex items-center gap-0.5 text-amber-600">
                        <Star className="size-3 fill-current" /> {p.rating} ({p.reviews})
                      </span>
                    )}
                    {p.sample && <span className="italic">sample listing</span>}
                  </div>
                  <p className="mt-1 text-xs">{p.description}</p>
                  <p className="mt-1 text-xs font-medium">{p.offers}</p>
                  <div className="mt-2">
                    {!d && (
                      <Button size="sm" variant="outline" onClick={() => draft(p)}>
                        <Mail /> Draft intro email
                      </Button>
                    )}
                    {d?.loading && (
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" /> Writing…
                      </span>
                    )}
                    {d?.text && (
                      <div className="space-y-2">
                        <Textarea
                          rows={8}
                          value={d.text}
                          onChange={(e) => setDrafts((x) => ({ ...x, [p.id]: { ...d, text: e.target.value } }))}
                          className="text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => copy(p.id, d.text!)}>
                            {copied === p.id ? <Check /> : <Copy />} Copy
                          </Button>
                          {!d.usedAi && <span className="text-xs text-muted-foreground">Template (Claude unavailable)</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
