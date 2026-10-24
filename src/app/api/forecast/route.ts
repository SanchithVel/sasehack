import { connection } from "next/server";
import { claude, FALLBACK, MODEL, textOf } from "@/lib/claude";
import { getDb } from "@/lib/db";
import { forecastFor } from "@/lib/forecast";
import { addDays, isoDate } from "@/lib/dates";

// GET ?date=YYYY-MM-DD (default tomorrow) → prep plan plus a short plain-English summary from Claude.
export async function GET(req: Request) {
  await connection();
  const date = new URL(req.url).searchParams.get("date") ?? undefined;
  const db = getDb();
  const forecast = await forecastFor(db, date);

  let summary = "";
  if (forecast.items.length) {
    try {
      const res = await claude().beta.messages.create({
        model: MODEL,
        max_tokens: 2000,
        ...FALLBACK,
        output_config: { effort: "low" },
        system:
          `You advise the owner of ${db.profile.name || "a small restaurant"} in ${db.profile.city}, Oklahoma, on how much food to prep. ` +
          "Write exactly 3 short bullet points (under 20 words each) using '- '. Be concrete: name items and amounts. No preamble.",
        messages: [{ role: "user", content: `Forecast data:\n${JSON.stringify(forecast)}` }],
      });
      summary = textOf(res.content);
    } catch {
      // Keep the page usable without an API key: summarize the biggest changes ourselves.
      summary = [...forecast.items]
        .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
        .slice(0, 3)
        .map((i) => `- ${i.name}: prep ${i.recommendedPrep} ${i.unit} (${i.changePct > 0 ? "+" : ""}${i.changePct}% vs usual).`)
        .join("\n");
    }
  }

  const nextDays = Array.from({ length: 7 }, (_, i) => isoDate(addDays(new Date(), i + 1)));
  return Response.json({ ...forecast, summary, nextDays });
}
