import { claude, FALLBACK, MODEL, textOf } from "@/lib/claude";
import { getDb } from "@/lib/db";
import { PARTNERS } from "@/lib/data/partners";
import { basicMessage } from "@/lib/templates";

const GOALS = {
  food_bank: "set up regular food-rescue donation pickups",
  shelter: "donate leftover prepared food to their meal program",
  pantry: "donate surplus bread, produce, and packaged goods",
  compost: "start a food-scrap compost pickup and ask for pricing",
  farm: "buy produce regularly and offer food scraps for their compost",
  supplier: "request a quote for regular weekly delivery",
};

// POST { partnerId, notes? } → a ready-to-send outreach email to a partner.
export async function POST(req: Request) {
  const { partnerId, notes } = (await req.json()) as { partnerId: string; notes?: string };
  const partner = PARTNERS.find((p) => p.id === partnerId);
  if (!partner) return Response.json({ error: "Unknown partner" }, { status: 404 });
  const db = getDb();

  try {
    const res = await claude().beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      ...FALLBACK,
      output_config: { effort: "low" },
      system:
        "Write a short, friendly outreach email from a small Oklahoma food business owner. " +
        "Start with a 'Subject:' line, then the email. Under 150 words. Sign with the owner's name, business, and phone. No placeholders in brackets.",
      messages: [
        {
          role: "user",
          content:
            `From: ${JSON.stringify(db.profile)}\nMenu: ${db.menu.map((m) => m.name).join(", ")}\n` +
            `To: ${partner.name} (${partner.type}, ${partner.city}). ${partner.description} ${partner.offers}\n` +
            `Goal: ${GOALS[partner.type]}.\nExtra notes from the owner: ${notes || "none"}`,
        },
      ],
    });
    if (res.stop_reason === "refusal") throw new Error("declined");
    return Response.json({ message: textOf(res.content), usedAi: true });
  } catch {
    return Response.json({ message: basicMessage(db, partner), usedAi: false });
  }
}
