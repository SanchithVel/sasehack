# PlateShare

Helps small Oklahoma food businesses **predict** how much to prep, **track** what they waste, **redistribute** surplus to local food banks, shelters, and compost, and **measure** their community impact.

## Setup

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Everything works without an API key: the forecast summary and outreach emails fall back to plain templates. Photo waste estimates and the assistant need a key.

## How the data works

The app starts with **demo data** (a sample OKC taco shop with 35 days of generated logs). To use real numbers, go to **Setup → Start with my own business**, then:

1. **Setup**: business details, the menu items you prep daily (unit, usual prep, cost and sale price per unit, lbs per unit), and upcoming events with an expected traffic change.
2. **Daily Log**: at close, enter prepared / sold / thrown out for each item. "Thrown out" fills in as prepared − sold. A photo can optionally estimate it with Claude.
3. **Donations**: find nearby food banks, shelters, and compost services, and create a ticket for each drop-off or pickup. Marking a ticket done counts it toward meals, deduction, and CO₂.

All data is saved to `data/db.json` (gitignored). **Load demo data** on the Setup page restores the sample.

## Pages

| Page | What it does |
|---|---|
| Dashboard (`/`) | $ and lbs wasted, waste reduction, meals donated, tax deduction estimate, CO₂, trend chart, and how each number is calculated |
| Daily Log (`/log`) | Manual daily entry plus an optional photo that fills in waste amounts |
| Prep Plan (`/prep`) | Next 7 days: avg sold on the same weekday (last 4 weeks), +10% if it sold out, × events, × weather (Open-Meteo), +5% buffer |
| Donations (`/donations`) | Owner-managed tickets (upcoming / done / cancelled) for donation and compost drop-offs or pickups, plus nearby places, suppliers, a map, and one-click intro emails |
| Assistant (`/assistant`) | Chat assistant with tools over the business's own data |
| Setup (`/setup`) | Profile, menu, costs, events, and demo/reset |

## Where things live

| Path | What |
|---|---|
| `src/lib/db.ts` | JSON-file database (swap for Supabase if you deploy to Vercel) |
| `src/lib/data/demo.ts` | Demo business and generated history |
| `src/lib/data/partners.ts` | Partner directory and distance helper |
| `src/lib/forecast.ts` | Prep forecast logic |
| `src/lib/impact.ts` | Waste, meals, CO₂, savings, and deduction calculations |
| `src/lib/claude.ts` | Claude client, model, and refusal fallback config |
| `src/lib/templates.ts` | Non-AI fallback for outreach emails |
| `src/app/api/*` | Route handlers (Claude calls stay server-side) |

## Notes

- Partners marked `sample` are made up, including their ratings and prices. The real organizations have approximate map coordinates, so check them before demoing.
- Impact numbers are estimates: 1.2 lbs per meal (Feeding America), 2.5 kg CO₂e per kg of food kept out of landfill, and a simplified enhanced-deduction formula (lesser of cost + half the markup, or 2× cost). This is not tax advice.
- The app is for business owners only. Partners don't log in; tickets are the owner's own record of where leftovers went.
- The UI never mentions the AI vendor. Code-level docs (this README, `src/lib/claude.ts`) still do.
