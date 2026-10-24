import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { claude, errorMessage, FALLBACK, MODEL, textOf } from "@/lib/claude";
import { getDb } from "@/lib/db";
import { milesBetween, PARTNERS } from "@/lib/data/partners";
import { forecastFor } from "@/lib/forecast";
import { impactSummary, topWastedItems, wasteByDay } from "@/lib/impact";

// Each tool reads the database fresh so answers reflect the latest logs.
const tools = [
  betaZodTool({
    name: "get_business",
    description: "The business profile and menu: items, units, usual prep, cost and sale price per unit.",
    inputSchema: z.object({}),
    run: async () => {
      const db = getDb();
      return JSON.stringify({ profile: db.profile, menu: db.menu, isDemoData: db.isDemo });
    },
  }),
  betaZodTool({
    name: "get_waste_summary",
    description: "Waste totals by menu item (lbs, $, waste rate) and the daily waste trend, from the owner's daily logs.",
    inputSchema: z.object({ days: z.number().int().min(1).max(365).describe("How many past days to include") }),
    run: async ({ days }) => {
      const db = getDb();
      return JSON.stringify({ byItem: topWastedItems(db, days), daily: wasteByDay(db).slice(-days) });
    },
  }),
  betaZodTool({
    name: "get_prep_forecast",
    description: "Recommended prep quantities per menu item for a date, with the reasons (history, events, weather).",
    inputSchema: z.object({ date: z.string().optional().describe("YYYY-MM-DD; defaults to tomorrow") }),
    run: async ({ date }) => JSON.stringify(await forecastFor(getDb(), date)),
  }),
  betaZodTool({
    name: "find_partners",
    description:
      "Local Oklahoma partners sorted by distance: food banks, shelters, pantries (donations), farms and compost (scraps), suppliers (meat, produce).",
    inputSchema: z.object({
      type: z.enum(["food_bank", "shelter", "pantry", "farm", "compost", "supplier"]).optional(),
    }),
    run: async ({ type }) => {
      const { profile } = getDb();
      return JSON.stringify(
        PARTNERS.filter((p) => !type || p.type === type)
          .map((p) => ({ ...p, miles: Math.round(milesBetween(profile, p)) }))
          .sort((a, b) => a.miles - b.miles),
      );
    },
  }),
  betaZodTool({
    name: "get_impact",
    description: "Impact so far: waste reduction, lbs and meals donated, compost, CO2 avoided, money saved, estimated tax deduction.",
    inputSchema: z.object({}),
    run: async () => {
      const db = getDb();
      return JSON.stringify({ ...impactSummary(db), recentPickups: db.surplus.slice(0, 5) });
    },
  }),
  betaZodTool({
    name: "get_events",
    description: "Events on the owner's calendar that change expected traffic.",
    inputSchema: z.object({}),
    run: async () => JSON.stringify(getDb().events),
  }),
];

// POST { messages } → assistant reply (runs the tool loop server-side).
export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Anthropic.Beta.BetaMessageParam[] };
  const { profile } = getDb();
  const system =
    `You are the operations assistant for ${profile.name || "a small food business"} (${profile.cuisine || "restaurant"}) in ${profile.city}, Oklahoma. ` +
    `Help the owner cut food waste, plan prep, donate surplus or compost scraps through local Oklahoma organizations, find suppliers, ` +
    `and with general questions about running and setting up the business. ` +
    `Use the tools for anything about their numbers instead of guessing, and say which numbers you used. Keep answers short and practical; use short lists. ` +
    `When asked to draft a message or email, write it ready to send and sign it with the owner's name. ` +
    `Partners marked sample are demo listings. For tax, legal, or food-safety rules, give general guidance and suggest confirming with a professional or the health department.`;
  try {
    const final = await claude().beta.messages.toolRunner({
      model: MODEL,
      max_tokens: 8000,
      ...FALLBACK,
      output_config: { effort: "medium" },
      system,
      tools,
      messages,
    });
    if (final.stop_reason === "refusal") {
      return Response.json({ reply: "Sorry, I can't help with that one." });
    }
    return Response.json({ reply: textOf(final.content) });
  } catch (err) {
    return Response.json({ error: errorMessage(err) }, { status: 500 });
  }
}
