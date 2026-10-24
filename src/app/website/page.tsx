"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Globe, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import type { WebsiteDraft } from "@/lib/types";

const IDEAS = [
  "Warm colors inspired by Oklahoma red dirt and sunsets",
  "Highlight our family story and local Oklahoma ingredients",
  "Add a catering section for office lunches",
];

export default function WebsitePage() {
  const [draft, setDraft] = useState<WebsiteDraft | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<WebsiteDraft | null>("/api/website").then((d) => {
      setDraft(d);
      if (d) setNotes(d.notes);
    });
  }, []);

  async function generate() {
    setLoading(true);
    setWarning("");
    try {
      const res = await api<WebsiteDraft & { warning: string }>("/api/website", { notes });
      setDraft(res);
      setWarning(res.warning);
    } catch (err) {
      setWarning((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([draft!.html], { type: "text/html" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "index.html" });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    await navigator.clipboard.writeText(draft!.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <PageHeader
        title="Website builder"
        subtitle="Claude drafts a one-page site from your business details and menu. Download it and host it anywhere."
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Describe what you want</CardTitle>
            <CardDescription>Name, menu, prices, hours, and address come from Setup automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Style, colors, sections, specials…" />
            <div className="flex flex-wrap gap-1">
              {IDEAS.map((idea) => (
                <button
                  key={idea}
                  onClick={() => setNotes((n) => (n ? `${n}\n${idea}` : idea))}
                  className="rounded-full border px-2 py-0.5 text-left text-xs hover:bg-muted"
                >
                  + {idea}
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} {draft ? "Regenerate" : "Generate website"}
            </Button>
            {loading && <p className="text-xs text-muted-foreground">This takes about 30–60 seconds.</p>}
            {warning && <p className="text-xs text-amber-700 dark:text-amber-400">{warning}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4" /> Preview
            </CardTitle>
            {draft && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? <Check /> : <Copy />} Copy HTML
                </Button>
                <Button size="sm" onClick={download}>
                  <Download /> Download
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {draft ? (
              // sandbox with no permissions: the generated page can't run scripts or navigate the app
              <iframe title="Website preview" sandbox="" srcDoc={draft.html} className="h-[70vh] w-full rounded-lg border bg-white" />
            ) : (
              <div className="flex h-[50vh] items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
                Your website preview appears here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
