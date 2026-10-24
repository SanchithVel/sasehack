// Plain templates used when the Claude API isn't available, so every feature still works.
import type { Db, Partner } from "@/lib/types";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function basicWebsite({ profile, menu }: Db) {
  const items = menu
    .map((m) => `<li><span>${esc(m.name)}</span><span>$${m.pricePerUnit.toFixed(2)} / ${esc(m.unit)}</span></li>`)
    .join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(profile.name)}</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;color:#1f2937;background:#fffbf5}
header{background:#166534;color:#fff;padding:64px 24px;text-align:center}
h1{margin:0 0 8px;font-size:2.5rem}main{max-width:720px;margin:0 auto;padding:32px 24px}
ul{list-style:none;padding:0}li{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e7eb}
.info{display:grid;gap:4px;margin-top:32px;padding:16px;background:#fff;border-radius:12px;border:1px solid #e5e7eb}
</style></head>
<body><header><h1>${esc(profile.name)}</h1><p>${esc(profile.cuisine)} in ${esc(profile.city)}, Oklahoma</p></header>
<main><p>${esc(profile.description)}</p><h2>Menu</h2><ul>${items}</ul>
<div class="info"><strong>Visit us</strong><span>${esc(profile.address)}</span><span>${esc(profile.hours)}</span><span>${esc(profile.phone)}</span></div>
<p><small>We donate unsold food to local shelters and compost our scraps.</small></p></main></body></html>`;
}

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
