// Plain template used when the AI API isn't available, so outreach emails still work.
import type { Db, Partner } from "@/lib/types";

export function basicMessage(db: Db, partner: Partner) {
  const { profile } = db;
  const sender = profile.ownerName || "the owner";
  const intro = `Hi ${partner.name} team,\n\nMy name is ${sender} and I run ${profile.name || "a restaurant"} in ${profile.city}.`;
  const body: Record<Partner["type"], string> = {
    food_bank: "We often have unsold prepared food at the end of the day and would like to set up regular donation pickups. Could you tell me how to become a food-rescue donor and what food-safety requirements you have?",
    shelter: "We have leftover prepared food most evenings and would love to donate it to your guests. Would your kitchen be able to accept regular drop-offs or pickups?",
    pantry: "We sometimes have surplus bread, produce, and packaged items and would like to donate them. What days and times work for drop-offs?",
    compost: "We'd like to start composting our food scraps instead of sending them to the landfill. Could you send pricing and the pickup schedule for our area?",
    farm: "We're interested in buying produce from you on a regular basis and could also supply compostable food scraps for your farm. Would you be open to talking?",
    supplier: "We're looking for a local supplier and would like a quote for regular weekly delivery. Could you send your price list, minimums, and delivery days?",
  };
  return `${intro}\n\n${body[partner.type]}\n\nThank you,\n${sender}\n${profile.name}${profile.phone ? `\n${profile.phone}` : ""}`;
}
