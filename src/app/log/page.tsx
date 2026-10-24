"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InfoTip } from "@/components/info-tip";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { weekday } from "@/lib/dates";
import type { DailyRecord, MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Row = { itemId: string; prepared: string; sold: string; wasted: string; wastedEdited: boolean };
type LogData = {
  date: string;
  today: string;
  menu: MenuItem[];
  entries: DailyRecord[];
  recent: { date: string; lbs: number; cost: number }[];
};
type Detected = { name: string; quantity: number; unit: string; estLbs: number; itemId: string | null };

/** Downscale a photo to a JPEG under the AI image size limits. Returns base64 (no data: prefix). */
async function toJpegBase64(file: File, maxSide = 1280): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const fetchLog = (date?: string) => api<LogData>(`/api/records${date ? `?date=${date}` : ""}`);

/** One editable row per menu item, pre-filled from any saved entry. */
const toRows = (res: LogData): Row[] =>
  res.menu.map((m) => {
    const e = res.entries.find((x) => x.itemId === m.id);
    return e
      ? { itemId: m.id, prepared: String(e.prepared), sold: String(e.sold), wasted: String(e.wasted), wastedEdited: true }
      : { itemId: m.id, prepared: String(m.usualPrep), sold: "", wasted: "", wastedEdited: false };
  });

export default function DailyLogPage() {
  const [date, setDate] = useState<string>(); // undefined = today (server decides)
  const [data, setData] = useState<LogData>();
  const [rows, setRows] = useState<Row[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  // Photo helper state
  const [preview, setPreview] = useState<string>();
  const [detected, setDetected] = useState<Detected[]>([]);
  const [notes, setNotes] = useState("");
  const [photoState, setPhotoState] = useState<"idle" | "analyzing" | "done">("idle");
  const [photoError, setPhotoError] = useState("");

  const show = useCallback((res: LogData) => {
    setData(res);
    setRows(toRows(res));
    setSaveState("idle");
  }, []);

  useEffect(() => {
    fetchLog(date).then(show);
  }, [date, show]);

  function setRow(i: number, patch: Partial<Row>) {
    setSaveState("idle");
    setRows((prev) =>
      prev.map((r, j) => {
        if (j !== i) return r;
        const next = { ...r, ...patch };
        // Until the owner types a waste number, assume leftovers = prepared - sold.
        if (!next.wastedEdited && next.sold !== "") {
          next.wasted = String(round1(Math.max(0, Number(next.prepared) - Number(next.sold))));
        }
        return next;
      }),
    );
  }

  async function save() {
    setSaveState("saving");
    const entries = rows
      .filter((r) => r.sold !== "" || r.wasted !== "")
      .map((r) => ({ itemId: r.itemId, prepared: Number(r.prepared), sold: Number(r.sold), wasted: Number(r.wasted) }));
    await api("/api/records", { date: data!.date, entries }, "PUT");
    show(await fetchLog(data!.date));
    setSaveState("saved");
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setDetected([]);
    setPhotoError("");
    setPhotoState("analyzing");
    try {
      const res = await api<{ items: Detected[]; notes: string }>("/api/analyze-waste", { image: await toJpegBase64(file) });
      setDetected(res.items);
      setNotes(res.notes);
      setPhotoState("done");
    } catch (err) {
      setPhotoError((err as Error).message);
      setPhotoState("idle");
    }
  }

  function applyPhoto() {
    setRows((prev) =>
      prev.map((r) => {
        const hit = detected.filter((d) => d.itemId === r.itemId);
        if (!hit.length) return r;
        return { ...r, wasted: String(round1(hit.reduce((s, d) => s + d.quantity, 0))), wastedEdited: true };
      }),
    );
    setSaveState("idle");
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  const itemOf = (id: string) => data.menu.find((m) => m.id === id)!;
  const totals = rows.reduce(
    (t, r) => {
      const m = itemOf(r.itemId);
      const w = Number(r.wasted) || 0;
      return { lbs: t.lbs + w * m.lbsPerUnit, cost: t.cost + w * m.costPerUnit };
    },
    { lbs: 0, cost: 0 },
  );
  const unmatched = detected.filter((d) => !d.itemId || !data.menu.some((m) => m.id === d.itemId));

  return (
    <>
      <PageHeader title="Daily log" info="At close, enter what you prepped, sold, and threw out for each item. Thrown out fills in as prepared minus sold; change it if you donated or saved some. Every number in the app comes from this log." />

      {data.menu.length === 0 ? (
        <Card>
          <CardContent className="text-sm">
            Add your menu items first on the{" "}
            <Link href="/setup" className="font-medium text-primary underline">
              Setup page
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>{weekday(data.date)}</CardTitle>
                <CardDescription>
                  {data.entries.length ? "Already logged. Edit and save to update." : "Not logged yet."}
                </CardDescription>
              </div>
              <Input type="date" className="w-40" value={data.date} max={data.today} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </CardHeader>
            <CardContent>
              <div className="mb-2 hidden grid-cols-[1fr_5rem_5rem_5rem] gap-2 text-xs font-medium text-muted-foreground sm:grid">
                <span>Item</span>
                <span>Prepared</span>
                <span>Sold</span>
                <span>Thrown out</span>
              </div>
              <div className="divide-y">
                {rows.map((r, i) => {
                  const m = itemOf(r.itemId);
                  return (
                    <div key={r.itemId} className="grid grid-cols-3 items-center gap-2 py-2 sm:grid-cols-[1fr_5rem_5rem_5rem]">
                      <div className="col-span-3 text-sm sm:col-span-1">
                        <span className="font-medium">{m.name}</span> <span className="text-xs text-muted-foreground">({m.unit})</span>
                      </div>
                      {(["prepared", "sold", "wasted"] as const).map((field) => (
                        <label key={field} className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground sm:hidden">
                            {field === "wasted" ? "Thrown out" : field[0].toUpperCase() + field.slice(1)}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            step="0.1"
                            inputMode="decimal"
                            value={r[field]}
                            placeholder="0"
                            className={cn(field === "wasted" && !r.wastedEdited && r.wasted && "text-muted-foreground")}
                            onChange={(e) =>
                              setRow(i, field === "wasted" ? { wasted: e.target.value, wastedEdited: true } : { [field]: e.target.value })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button onClick={save} disabled={saveState === "saving"}>
                  {saveState === "saving" ? <Loader2 className="animate-spin" /> : <Save />} Save {weekday(data.date)}
                </Button>
                <span className="text-sm">
                  Waste: <strong>{round1(totals.lbs)} lbs</strong> · <strong>${Math.round(totals.cost)}</strong>
                </span>
                {saveState === "saved" && (
                  <span className="flex items-center gap-1 text-sm text-primary">
                    <Check className="size-4" /> Saved
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="size-4" /> Scan leftovers
                  <InfoTip align="end">Optional. Snap a photo of what&apos;s left and we estimate the thrown-out amounts. Check them before saving.</InfoTip>
                </CardTitle>
                
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 border-dashed text-muted-foreground hover:bg-muted/50">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Leftovers" className="size-full object-cover" />
                  ) : (
                    <>
                      <Camera className="size-7" />
                      <span className="text-xs">Take or upload a photo</span>
                    </>
                  )}
                  {/* capture="environment" opens the rear camera on phones */}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
                </label>
                {photoState === "analyzing" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Analyzing photo…
                  </div>
                )}
                {photoError && <p className="text-sm text-destructive">{photoError}</p>}
                {photoState === "done" && (
                  <>
                    <ul className="space-y-1 text-sm">
                      {detected.map((d, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{d.name}</span>
                          <span className="text-muted-foreground">
                            {d.quantity} {d.unit} · {d.estLbs} lb
                          </span>
                        </li>
                      ))}
                    </ul>
                    {unmatched.length > 0 && (
                      <p className="text-xs text-muted-foreground">Not on your menu, so not applied: {unmatched.map((d) => d.name).join(", ")}</p>
                    )}
                    {notes && <p className="rounded-lg bg-muted p-2 text-xs">{notes}</p>}
                    <Button variant="outline" className="w-full" onClick={applyPhoto}>
                      Apply to &quot;thrown out&quot;
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent days</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.recent.length === 0 && <p className="text-sm text-muted-foreground">Nothing logged yet.</p>}
                {data.recent.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setDate(d.date)}
                    className={cn(
                      "flex w-full justify-between rounded-md px-2 py-1 text-sm hover:bg-muted",
                      d.date === data.date && "bg-primary/10 text-primary",
                    )}
                  >
                    <span>
                      {weekday(d.date).slice(0, 3)} {d.date.slice(5)}
                    </span>
                    <span className="text-muted-foreground">
                      {d.lbs} lb · ${d.cost}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
