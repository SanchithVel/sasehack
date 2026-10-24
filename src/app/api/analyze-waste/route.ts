import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { claude, errorMessage, FALLBACK, MODEL } from "@/lib/claude";
import { getDb } from "@/lib/db";

const WasteAnalysis = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      estLbs: z.number(),
      itemId: z.string().nullable(),
    }),
  ),
  notes: z.string(),
});

// POST { image: base64 JPEG } → itemized estimate of leftover food in the photo.
export async function POST(req: Request) {
  const { image } = (await req.json()) as { image: string };
  const menuList = getDb()
    .menu.map((m) => `- ${m.id}: ${m.name} (measured in ${m.unit}, ${m.lbsPerUnit} lbs per ${m.unit})`)
    .join("\n");
  try {
    const res = await claude().beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      ...FALLBACK,
      output_config: { effort: "low", format: betaZodOutputFormat(WasteAnalysis) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
            {
              type: "text",
              text:
                `This is an end-of-day photo of leftover food at a restaurant. Estimate each leftover food item, ` +
                `its quantity, and its weight in lbs. A full standard hotel pan holds about 8-10 lbs.\n\n` +
                `Match items to this menu when possible: set itemId to the menu id and give quantity in that item's unit. ` +
                `Otherwise set itemId to null.\n${menuList || "(no menu entered yet)"}\n\n` +
                `In notes, give one short sentence on whether the leftovers look safe to donate or better for compost.`,
            },
          ],
        },
      ],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) {
      return Response.json({ error: "Couldn't analyze that photo. Try another one." }, { status: 422 });
    }
    return Response.json(res.parsed_output);
  } catch (err) {
    return Response.json({ error: errorMessage(err) }, { status: 500 });
  }
}
