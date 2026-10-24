# PlateShare OK

Helps small Oklahoma food businesses **predict** how much to prep, **track** what they waste, **redistribute** surplus to local food banks, shelters, and compost, and **measure** their community impact.

## Setup

```bash
npm install
cp .env.example .env.local   # then paste your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Everything works without an API key: the forecast summary, website, and outreach emails fall back to plain templates. Photo waste estimates and the assistant need a key.

## How the data works

The app starts with **demo data** (a sample OKC taco shop with 35 days of generated logs). To use real numbers, go to **Setup → Start with my own business**, then:

1. **Setup**: business details, the menu items you prep daily (unit, usual prep, cost and sale price per unit, lbs per unit), and upcoming events with an expected traffic change.
2. **Daily Log**: at close, enter prepared / sold / thrown out for each item. "Thrown out" fills in as prepared − sold. A photo can optionally estimate it with Claude.
3. **Surplus**: post leftovers for donation or compost. Claimed donations feed the meals, deduction, and CO₂ numbers.

All data is saved to `data/db.json` (gitignored). **Load demo data** on the Setup page restores the sample.

## Pages

| Page | What it does |
|---|---|
| Dashboard (`/`) | $ and lbs wasted, waste reduction, meals donated, tax deduction estimate, CO₂, trend chart, and how each number is calculated |
| Daily Log (`/log`) | Manual daily entry plus an optional photo that fills in waste amounts |
| Prep Forecast (`/prep`) | Next 7 days: avg sold on the same weekday (last 4 weeks), +10% if it sold out, × events, × weather (Open-Meteo), +5% buffer |
| Surplus & Partners (`/surplus`) | Donate or compost posts, a simulated partner claim, the partner directory with distance, ratings, a map, and one-click intro emails |
| Website Builder (`/website`) | Claude generates a one-page site from Setup data. Preview, copy, or download |
| Assistant (`/assistant`) | Claude with tools over the business's own data |
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
| `src/lib/templates.ts` | Non-AI fallbacks for the website and emails |
| `src/app/api/*` | Route handlers (Claude calls stay server-side) |

## Notes

- Partners marked `sample` are made up, including their ratings and prices. The real organizations have approximate map coordinates, so check them before demoing.
- Impact numbers are estimates: 1.2 lbs per meal (Feeding America), 2.5 kg CO₂e per kg of food kept out of landfill, and a simplified enhanced-deduction formula (lesser of cost + half the markup, or 2× cost). This is not tax advice.
- Text alerts to partners are simulated. Twilio would go in `src/app/api/surplus/route.ts`.
