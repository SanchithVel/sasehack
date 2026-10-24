import { connection } from "next/server";
import { claude, FALLBACK, MODEL, textOf } from "@/lib/claude";
import { forecastTomorrow } from "@/lib/forecast";

// GET → tomorrow's prep plan plus a short plain-English summary from Claude.
export async function GET() {
  await connection();
  const forecast = await forecastTomorrow();

  let summary: string;
  try {
    const res = await claude().beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      ...FALLBACK,
      output_config: { effort: "low" },
      system:
        "You advise a small restaurant owner in Oklahoma on how much food to prep. " +
        "Write exactly 3 short bullet points (under 20 words each) using '- '. Be concrete: name items and amounts. No preamble.",
      messages: [{ role: "user", content: `Tomorrow's forecast data:\n${JSON.stringify(forecast)}` }],
    });
    summary = textOf(res.content);
  } catch {
    // Keep the page usable without an API key.
    const biggest = [...forecast.items].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
    summary = `- ${biggest.name}: prep ${biggest.recommendedPrep} ${biggest.unit} (${biggest.changePct > 0 ? "+" : ""}${biggest.changePct}% vs usual).`;
  }

  return Response.json({ ...forecast, summary });
}
