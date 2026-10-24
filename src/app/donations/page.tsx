"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Check, ClipboardList, Copy, HandHeart, Loader2, Mail, Plus, Recycle, RotateCcw, Star, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Select } from "@/components/form";
import { InfoTip } from "@/components/info-tip";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { addDays, isoDate } from "@/lib/dates";
import { COMPOST_TYPES, DONATION_TYPES, milesBetween, PARTNER_LABELS, PARTNERS } from "@/lib/data/partners";
import type { DailyRecord, MenuItem, Partner, Profile, Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

const PartnerMap = dynamic(() => import("@/components/partner-map"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-lg bg-muted" />,
});

type Item = Ticket["items"][number];
type Kind = Ticket["kind"];
type Draft = Omit<Ticket, "id" | "createdAt" | "status" | "estLbs">;

const LBS_PER: Record<string, number> = { lbs: 1, dozen: 1.1, trays: 9, servings: 0.75, pieces: 0.25, gallons: 8.3 };
const emptyItem = (): Item => ({ name: "", quantity: 1, unit: "lbs" });
const partnerById = (id: string) => PARTNERS.find((p) => p.id === id);
const typesFor = (kind: Kind) => (kind === "donate" ? DONATION_TYPES : COMPOST_TYPES);

const FILTERS = [
  { key: "donate", label: "Donate", types: DONATION_TYPES },
  { key: "compost", label: "Compost", types: COMPOST_TYPES },
  { key: "supplier", label: "Suppliers", types: ["supplier"] as Partner["type"][] },
] as const;

const TABS = [
  { key: "scheduled", label: "Upcoming" },
  { key: "completed", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
] as const;

function when(t: Ticket) {
  return new Date(t.scheduledFor).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function DonationsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profile, setProfile] = useState<Profile>();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Ticket["status"]>("scheduled");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("donate");
  const [emails, setEmails] = useState<Record<string, string | null>>({}); // null = loading
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api<{ tickets: Ticket[]; profile: Profile }>("/api/tickets").then((d) => {
      setTickets(d.tickets);
      setProfile(d.profile);
    });
  }, []);

  const here = profile ?? { lat: 35.4676, lng: -97.5164, name: "" };
  const nearby = (types: Partner["type"][]) =>
    PARTNERS.filter((p) => types.includes(p.type))
      .map((p) => ({ ...p, miles: milesBetween(here, p) }))
      .sort((a, b) => a.miles - b.miles);

  function openForm(kind: Kind = "donate", partnerId?: string) {
    setError("");
    setDraft({
      kind,
      partnerId: partnerId ?? nearby(typesFor(kind))[0].id,
      method: "drop-off",
      scheduledFor: `${isoDate(new Date())}T21:30`,
      items: [emptyItem()],
      notes: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const setItem = (i: number, p: Partial<Item>) => patch({ items: draft!.items.map((it, j) => (j === i ? { ...it, ...p } : it)) });

  async function fillFromLog() {
    const d = await api<{ menu: MenuItem[]; entries: DailyRecord[] }>("/api/records");
    const items = d.entries
      .filter((e) => e.wasted > 0)
      .map((e) => {
        const m = d.menu.find((x) => x.id === e.itemId)!;
        return { name: m.name, quantity: e.wasted, unit: m.unit };
      });
    if (items.length) patch({ items });
    else setError("Nothing marked as thrown out in today's log yet.");
  }

  async function create() {
    const items = draft!.items.filter((i) => i.name.trim() && i.quantity > 0);
    if (!items.length) return setError("Add at least one item.");
    const estLbs = Math.round(items.reduce((s, i) => s + i.quantity * (LBS_PER[i.unit] ?? 1), 0));
    try {
      const t = await api<Ticket>("/api/tickets", { ...draft, items, estLbs });
      setTickets((ts) => [t, ...ts]);
      setDraft(null);
      setTab("scheduled");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function setStatus(id: string, status: Ticket["status"]) {
    const t = await api<Ticket>("/api/tickets", { id, status }, "PATCH");
    setTickets((ts) => ts.map((x) => (x.id === id ? t : x)));
  }

  async function remove(id: string) {
    await api("/api/tickets", { id }, "DELETE");
    setTickets((ts) => ts.filter((x) => x.id !== id));
  }

  async function email(p: Partner) {
    setEmails((e) => ({ ...e, [p.id]: null }));
    const res = await api<{ message: string }>("/api/draft-message", { partnerId: p.id });
    setEmails((e) => ({ ...e, [p.id]: res.message }));
  }

  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1500);
  }

  const shownTickets = tickets
    .filter((t) => t.status === tab)
    .sort((a, b) => (tab === "scheduled" ? a.scheduledFor.localeCompare(b.scheduledFor) : b.scheduledFor.localeCompare(a.scheduledFor)));
  const places = nearby([...FILTERS.find((f) => f.key === filter)!.types]);
  const options = draft ? nearby(typesFor(draft.kind)) : [];

  return (
    <>
      <PageHeader
        title="Donations"
        info="Find places near you that take leftover food or scraps, then make a ticket for each drop-off or pickup. Mark it done once it's delivered. Done tickets count toward your meals donated and tax deduction."
        action={
          !draft && (
            <Button onClick={() => openForm()}>
              <Plus /> New ticket
            </Button>
          )
        }
      />

      {draft && (
        <Card className="mb-6 ring-primary/40">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>New ticket</CardTitle>
            <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setDraft(null)}>
              <X />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(["donate", "compost"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => patch({ kind: k, partnerId: nearby(typesFor(k))[0].id })}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm",
                    draft.kind === k ? "border-primary bg-primary/15 font-medium text-primary" : "hover:bg-muted",
                  )}
                >
                  {k === "donate" ? <HandHeart className="size-4" /> : <Recycle className="size-4" />}
                  {k === "donate" ? "Donate food" : "Compost scraps"}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1.3fr]">
              <Field label="Going to">
                <Select value={draft.partnerId} onChange={(e) => patch({ partnerId: e.target.value })}>
                  {options.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.miles.toFixed(1)} mi
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="How">
                <Select value={draft.method} onChange={(e) => patch({ method: e.target.value as Draft["method"] })}>
                  <option value="drop-off">I drop off</option>
                  <option value="pickup">They pick up</option>
                </Select>
              </Field>
              <Field label="When">
                <Input
                  type="datetime-local"
                  value={draft.scheduledFor}
                  min={`${isoDate(addDays(new Date(), -7))}T00:00`}
                  onChange={(e) => patch({ scheduledFor: e.target.value })}
                />
              </Field>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">What&apos;s going</span>
                <Button variant="ghost" size="sm" onClick={fillFromLog}>
                  <ClipboardList /> Use today&apos;s log
                </Button>
              </div>
              {draft.items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_4.5rem_5.5rem_auto] gap-2">
                  <Input placeholder="Item" value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                  <Input type="number" min={0} value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
                  <Select value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })}>
                    {Object.keys(LBS_PER).map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </Select>
                  <Button variant="ghost" size="icon" aria-label="Remove item" onClick={() => patch({ items: draft.items.filter((_, j) => j !== i) })}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => patch({ items: [...draft.items, emptyItem()] })}>
                <Plus /> Add item
              </Button>
            </div>

            <Field label="Notes (optional)">
              <Input value={draft.notes} placeholder="Side door, ask for Sam…" onChange={(e) => patch({ notes: e.target.value })} />
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={create}>
              <Check /> Create ticket
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Tickets</CardTitle>
          <div className="flex rounded-lg bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm",
                  tab === t.key ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label} <span className="text-xs opacity-60">{tickets.filter((x) => x.status === t.key).length}</span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {shownTickets.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No tickets here.</p>}
          {shownTickets.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className={cn("rounded-full p-2", t.kind === "donate" ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-400")}>
                {t.kind === "donate" ? <HandHeart className="size-4" /> : <Recycle className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-medium">
                  {partnerById(t.partnerId)?.name ?? "Unknown place"}
                  {t.notes && <InfoTip>{t.notes}</InfoTip>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {when(t)} · {t.method === "pickup" ? "Pickup" : "Drop-off"} · ~{t.estLbs} lbs
                </div>
                <div className="truncate text-sm text-muted-foreground">{t.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(", ")}</div>
              </div>
              <div className="flex gap-1">
                {t.status === "scheduled" ? (
                  <>
                    <Button size="sm" onClick={() => setStatus(t.id, "completed")}>
                      <Check /> Done
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(t.id, "cancelled")}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(t.id, "scheduled")}>
                      <RotateCcw /> Reopen
                    </Button>
                    {t.status === "cancelled" && (
                      <Button size="icon-sm" variant="ghost" aria-label="Delete ticket" onClick={() => remove(t.id)}>
                        <Trash2 />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            Places near you
            <InfoTip align="start">
              Real food banks and shelters are listed with approximate locations. Places marked &quot;sample&quot; are examples for the demo.
            </InfoTip>
          </CardTitle>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  filter === f.key ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PartnerMap center={{ ...here, name: profile?.name ?? "" }} partners={places} />
          <div className="divide-y">
            {places.map((p) => {
              const draftEmail = emails[p.id];
              const canTicket = DONATION_TYPES.includes(p.type) || COMPOST_TYPES.includes(p.type);
              return (
                <div key={p.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        {p.name}
                        <InfoTip>
                          {p.description}
                          <br />
                          <span className="font-medium">{p.offers}</span>
                        </InfoTip>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                        <span>{PARTNER_LABELS[p.type]}</span>·<span>{p.miles.toFixed(1)} mi</span>
                        {p.rating && (
                          <span className="inline-flex items-center gap-0.5 text-amber-400">
                            · <Star className="size-3.5 fill-current" /> {p.rating}
                          </span>
                        )}
                        {p.sample && <Badge variant="outline">sample</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => email(p)} disabled={draftEmail === null}>
                        {draftEmail === null ? <Loader2 className="animate-spin" /> : <Mail />} Email
                      </Button>
                      {canTicket && (
                        <Button size="sm" variant="outline" onClick={() => openForm(DONATION_TYPES.includes(p.type) ? "donate" : "compost", p.id)}>
                          <Plus /> Ticket
                        </Button>
                      )}
                    </div>
                  </div>
                  {draftEmail && (
                    <div className="mt-2 space-y-2">
                      <Textarea rows={8} value={draftEmail} onChange={(e) => setEmails((x) => ({ ...x, [p.id]: e.target.value }))} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copy(p.id, draftEmail)}>
                          {copied === p.id ? <Check /> : <Copy />} Copy
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEmails((x) => ({ ...x, [p.id]: "" }))}>
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
