import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { claude, errorMessage, FALLBACK, MODEL, textOf } from "@/lib/claude";
import { BUSINESS, MENU } from "@/lib/data/business";
import { PARTNERS } from "@/lib/data/partners";
import { upcomingEvents } from "@/lib/data/events";
import { forecastTomorrow } from "@/lib/forecast";
import { impactSummary, topWastedItems, wasteByDay } from "@/lib/impact";
import { store } from "@/lib/store";

const tools = [
  betaZodTool({
    name: "get_waste_summary",
    description: "Waste totals by menu item (lbs, $, waste rate) and the daily waste trend for the restaurant.",
    inputSchema: z.object({ days: z.number().int().min(1).max(35).describe("How many past days to include") }),
    run: async ({ days }) => JSON.stringify({ byItem: topWastedItems(days), daily: wasteByDay().slice(-days) }),
  }),
  betaZodTool({
    name: "get_prep_forecast",
    description: "Tomorrow's recommended prep quantities per menu item, with weather and local event adjustments.",
    inputSchema: z.object({}),
    run: async () => JSON.stringify(await forecastTomorrow()),
  }),
  betaZodTool({
    name: "find_partners",
    description: "Local Oklahoma partners: food banks, shelters, pantries (donations), farms and compost (scraps), suppliers.",
    inputSchema: z.object({
      type: z.enum(["food_bank", "shelter", "pantry", "farm", "compost", "supplier"]).optional(),
    }),
    run: async ({ type }) => JSON.stringify(PARTNERS.filter((p) => !type || p.type === type)),
  }),
  betaZodTool({
    name: "get_impact",
    description: "Impact so far: waste reduction %, lbs and meals donated, CO2 avoided, money saved, estimated tax deduction.",
    inputSchema: z.object({}),
    run: async () => JSON.stringify({ ...impactSummary(), recentDonations: store.surplus.slice(0, 5) }),
  }),
  betaZodTool({
    name: "get_upcoming_events",
    description: "Local events in the next week that may change customer demand.",
    inputSchema: z.object({}),
    run: async () => JSON.stringify(upcomingEvents()),
  }),
];

const SYSTEM =
  `You are the operations assistant for ${BUSINESS.name}, a small restaurant in ${BUSINESS.city}. ` +
  `Menu: ${MENU.map((m) => m.name).join(", ")}. ` +
  `Help the owner cut food waste, plan prep, donate surplus to local Oklahoma organizations, and run the business. ` +
  `Use the tools to answer with their real numbers instead of guessing. Keep answers short and practical. ` +
  `When asked to draft a message or email, write it ready to send. ` +
  `Partners marked sample are demo data. For tax or legal questions, give general info and suggest confirming with a professional.`;

// POST { messages } → assistant reply (runs the tool loop server-side).
export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Anthropic.Beta.BetaMessageParam[] };
  try {
    const final = await claude().beta.messages.toolRunner({
      model: MODEL,
      max_tokens: 8000,
      ...FALLBACK,
      output_config: { effort: "medium" },
      system: SYSTEM,
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
