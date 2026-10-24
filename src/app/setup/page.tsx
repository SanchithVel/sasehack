"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Loader2, Plus, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InfoTip } from "@/components/info-tip";
import { PageHeader } from "@/components/page-header";
import { Field, Select } from "@/components/form";
import { api } from "@/lib/api";
import { CATEGORIES, DEFAULT_LBS_PER_UNIT, OK_CITIES, UNITS } from "@/lib/constants";
import { addDays, isoDate } from "@/lib/dates";
import type { LocalEvent, MenuItem, Profile, Unit } from "@/lib/types";

type Setup = { isDemo: boolean; profile: Profile; menu: MenuItem[]; events: LocalEvent[] };

const newId = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item"}-${Math.random().toString(36).slice(2, 6)}`;

export default function SetupPage() {
  const [data, setData] = useState<Setup>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<Setup>("/api/setup").then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  const { profile, menu, events } = data;
  const setProfile = (patch: Partial<Profile>) => setData({ ...data, profile: { ...profile, ...patch } });
  const setItem = (i: number, patch: Partial<MenuItem>) =>
    setData({ ...data, menu: menu.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  const setEvent = (i: number, patch: Partial<LocalEvent>) =>
    setData({ ...data, events: events.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  async function save() {
    setSaving(true);
    try {
      const saved = await api<Setup>("/api/setup", { profile, menu, events }, "PUT");
      setData(saved);
      setMessage("Saved.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function reset(action: "demo" | "reset") {
    const ok = confirm(
      action === "demo"
        ? "Replace everything with the Maria's Tacos demo data?"
        : "Delete all data (menu, logs, donations) and start fresh with your own business?",
    );
    if (!ok) return;
    setData(await api<Setup>("/api/setup", { action }));
    setMessage(action === "demo" ? "Demo data loaded." : "Cleared. Enter your business and menu below, then save.");
  }

  return (
    <>
      <PageHeader title="Setup" info="Your menu, costs, and calendar drive every number in the app, so keep them accurate." />

      {data.isDemo && (
        <Card className="mb-4 bg-amber-500/10 ring-amber-500/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-amber-200">
            <span>You&apos;re viewing sample data for a taco shop.</span>
            <Button onClick={() => reset("reset")}>
              <Sparkles /> Start with my own business
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Business
              <InfoTip align="start">Used for the weather forecast, nearby donation spots, emails, and your website.</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Business name">
              <Input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="Maria's Tacos" />
            </Field>
            <Field label="Owner name">
              <Input value={profile.ownerName} onChange={(e) => setProfile({ ownerName: e.target.value })} />
            </Field>
            <Field label="Type of food">
              <Input value={profile.cuisine} onChange={(e) => setProfile({ cuisine: e.target.value })} placeholder="BBQ, bakery, Vietnamese…" />
            </Field>
            <Field label="City">
              <Select
                value={profile.city}
                onChange={(e) => {
                  const c = OK_CITIES.find((c) => c.name === e.target.value)!;
                  setProfile({ city: c.name, lat: c.lat, lng: c.lng });
                }}
              >
                {OK_CITIES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Address">
              <Input value={profile.address} onChange={(e) => setProfile({ address: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={profile.phone} onChange={(e) => setProfile({ phone: e.target.value })} />
            </Field>
            <Field label="Hours">
              <Input value={profile.hours} onChange={(e) => setProfile({ hours: e.target.value })} placeholder="Mon–Sat 11am–9pm" />
            </Field>
            <Field label="Short description" className="sm:col-span-2">
              <Textarea value={profile.description} onChange={(e) => setProfile({ description: e.target.value })} rows={2} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Menu
              <InfoTip align="start">
                Items you prep each day. Cost = what one unit costs you to make. Price = what one unit sells for. lbs/unit converts to
                pounds (e.g. a dozen tortillas ≈ 1.1 lbs).
              </InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {menu.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
            {menu.map((m, i) => (
              <div key={m.id} className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-[2fr_1.4fr_1fr_1fr_1fr_1fr_1fr_auto] sm:items-end">
                <Field label="Item" className="col-span-2 sm:col-span-1">
                  <Input value={m.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                </Field>
                <Field label="Category">
                  <Select value={m.category} onChange={(e) => setItem(i, { category: e.target.value as MenuItem["category"] })}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Unit">
                  <Select
                    value={m.unit}
                    onChange={(e) => {
                      const unit = e.target.value as Unit;
                      setItem(i, { unit, lbsPerUnit: DEFAULT_LBS_PER_UNIT[unit] });
                    }}
                  >
                    {UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Usual prep">
                  <Input type="number" min={0} value={m.usualPrep} onChange={(e) => setItem(i, { usualPrep: Number(e.target.value) })} />
                </Field>
                <Field label="Cost $/unit">
                  <Input type="number" min={0} step="0.01" value={m.costPerUnit} onChange={(e) => setItem(i, { costPerUnit: Number(e.target.value) })} />
                </Field>
                <Field label="Price $/unit">
                  <Input type="number" min={0} step="0.01" value={m.pricePerUnit} onChange={(e) => setItem(i, { pricePerUnit: Number(e.target.value) })} />
                </Field>
                <Field label="lbs/unit">
                  <Input type="number" min={0} step="0.05" value={m.lbsPerUnit} onChange={(e) => setItem(i, { lbsPerUnit: Number(e.target.value) })} />
                </Field>
                <Button variant="ghost" size="icon" aria-label="Remove item" onClick={() => setData({ ...data, menu: menu.filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setData({
                  ...data,
                  menu: [
                    ...menu,
                    { id: newId("item"), name: "", category: "main", unit: "lbs", usualPrep: 10, costPerUnit: 0, pricePerUnit: 0, lbsPerUnit: 1 },
                  ],
                })
              }
            >
              <Plus /> Add menu item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Events
              <InfoTip align="start">Games, festivals, holidays, road work: anything you expect to change how busy you are. Use + or − %.</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.map((e, i) => (
              <div key={e.id} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[9.5rem_1fr_7rem_auto] sm:items-end">
                <Field label="Date">
                  <Input type="date" value={e.date} onChange={(ev) => setEvent(i, { date: ev.target.value })} />
                </Field>
                <Field label="Event" className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                  <Input value={e.name} onChange={(ev) => setEvent(i, { name: ev.target.value })} placeholder="Thunder home game" />
                </Field>
                <Field label="Traffic change %" className="row-start-3 sm:row-start-auto">
                  <Input type="number" value={e.changePct} onChange={(ev) => setEvent(i, { changePct: Number(ev.target.value) })} />
                </Field>
                <Button variant="ghost" size="icon" aria-label="Remove event" onClick={() => setData({ ...data, events: events.filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setData({
                  ...data,
                  events: [...events, { id: newId("event"), date: isoDate(addDays(new Date(), 1)), name: "", changePct: 20 }],
                })
              }
            >
              <CalendarPlus /> Add event
            </Button>
          </CardContent>
        </Card>

        <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3 shadow-sm md:bottom-4">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save setup
          </Button>
          <span className="text-sm text-muted-foreground">{message}</span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => reset("demo")}>
              <RotateCcw /> Load demo data
            </Button>
            {!data.isDemo && (
              <Button variant="ghost" size="sm" onClick={() => reset("reset")}>
                <Trash2 /> Clear all
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
