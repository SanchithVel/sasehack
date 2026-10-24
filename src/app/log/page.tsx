"use client";

import { useState } from "react";
import { Camera, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";

type Item = { name: string; quantity: number; unit: string; estLbs: number; itemId: string | null };

/** Downscale a photo to a JPEG under Claude's image size limits. Returns base64 (no data: prefix). */
async function toJpegBase64(file: File, maxSide = 1280): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

export default function LogWastePage() {
  const [preview, setPreview] = useState<string>();
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "analyzing" | "ready" | "saved">("idle");
  const [error, setError] = useState("");

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setItems([]);
    setError("");
    setStatus("analyzing");
    const res = await fetch("/api/analyze-waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: await toJpegBase64(file) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setStatus("idle");
      return;
    }
    setItems(data.items);
    setNotes(data.notes);
    setStatus("ready");
  }

  const update = (i: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  async function save() {
    await fetch("/api/waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, source: "photo" }),
    });
    setStatus("saved");
  }

  const totalLbs = items.reduce((s, i) => s + Number(i.estLbs || 0), 0);

  return (
    <>
      <PageHeader title="Log tonight's waste" subtitle="Snap a photo of the leftovers. Claude itemizes it for you." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed text-muted-foreground hover:bg-muted/50">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Leftovers" className="size-full object-cover" />
              ) : (
                <>
                  <Camera className="size-10" />
                  <span className="text-sm">Tap to take or upload a photo</span>
                </>
              )}
              {/* capture="environment" opens the rear camera on phones */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detected leftovers</CardTitle>
            <CardDescription>
              {status === "ready" || status === "saved"
                ? `About ${totalLbs.toFixed(1)} lbs total. Edit anything that looks off.`
                : "Results show up here."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {status === "analyzing" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Analyzing photo…
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] items-center gap-2">
                <Input value={item.name} onChange={(e) => update(i, { name: e.target.value })} />
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                  aria-label="Quantity"
                />
                <span className="text-xs text-muted-foreground">
                  {item.unit} · {item.estLbs} lb
                </span>
                <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </div>
            ))}

            {notes && <p className="rounded-lg bg-muted p-3 text-sm">{notes}</p>}

            {status === "ready" && items.length > 0 && (
              <Button onClick={save} className="w-full">
                Save to today&apos;s log
              </Button>
            )}
            {status === "saved" && (
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Check className="size-4" /> Saved. Have extra? Post it on the Surplus page for a pickup.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
