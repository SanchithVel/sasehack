"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What am I wasting the most money on?",
  "How much should I prep tomorrow, and why?",
  "Draft an email to Regional Food Bank of Oklahoma about weekly pickups.",
  "Where can I send food scraps for compost?",
  "Which local beef supplier would be cheapest for me?",
  "What permits do I need to sell food in Oklahoma City?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply ?? `⚠️ ${data.error}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Assistant" info="Ask about your waste, prep, donations, suppliers, or running your business. Answers use your own logs and menu." />

      <Card>
        <CardContent className="flex h-[60vh] flex-col gap-3">
          <div className="flex-1 space-y-3 overflow-y-auto">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <Sparkles className="size-8 text-primary" />
                <div className="grid gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="rounded-lg border p-3 text-left text-sm hover:bg-muted">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Checking your data…
              </div>
            )}
            <div ref={bottom} />
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Textarea
              rows={1}
              className="min-h-10 resize-none"
              placeholder="Ask anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={loading}>
              <Send />
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
