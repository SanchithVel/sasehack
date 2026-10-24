import { connection } from "next/server";
import { claude, errorMessage, FALLBACK, MODEL, textOf } from "@/lib/claude";
import { getDb, updateDb } from "@/lib/db";
import { basicWebsite } from "@/lib/templates";

export async function GET() {
  await connection();
  return Response.json(getDb().website);
}

// POST { notes } → generate a one-page website from the business profile and menu.
export async function POST(req: Request) {
  const { notes } = (await req.json()) as { notes: string };
  const db = getDb();
  if (!db.profile.name) return Response.json({ error: "Add your business name on the Setup page first." }, { status: 400 });

  let html: string;
  let usedAi = true;
  let warning = "";
  try {
    const message = await claude()
      .beta.messages.stream({
        model: MODEL,
        max_tokens: 24000,
        ...FALLBACK,
        output_config: { effort: "low" },
        system:
          "You are a web designer building a one-page website for a small local food business. " +
          "Return only a complete HTML document (starting with <!doctype html>) with all CSS inline in a <style> tag. " +
          "No JavaScript and no external files except Google Fonts. Use emoji or CSS shapes instead of images. " +
          "Make it mobile-friendly and warm: a hero with the name and tagline, about, menu with prices, hours and location, " +
          "and a short section about how the business donates surplus food and composts.",
        messages: [
          {
            role: "user",
            content:
              `Business details:\n${JSON.stringify(db.profile, null, 2)}\n\n` +
              `Menu (price is per unit):\n${db.menu.map((m) => `- ${m.name}: $${m.pricePerUnit} per ${m.unit}`).join("\n")}\n\n` +
              `Owner's requests: ${notes || "none"}`,
          },
        ],
      })
      .finalMessage();
    if (message.stop_reason === "refusal") throw new Error("Request declined");
    html = textOf(message.content).replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
    if (!html.toLowerCase().startsWith("<!doctype")) throw new Error("Unexpected response");
  } catch (err) {
    html = basicWebsite(db);
    usedAi = false;
    warning = `${errorMessage(err)} Showing a basic template instead.`;
  }

  const website = { html, notes, createdAt: new Date().toISOString() };
  updateDb((d) => {
    d.website = website;
  });
  return Response.json({ ...website, usedAi, warning });
}
