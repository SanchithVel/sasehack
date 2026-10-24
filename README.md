# PlateShare OK

Helps small Oklahoma food businesses **predict** how much to prep, **log** waste from a photo, **redistribute** surplus to local food banks and shelters, and **measure** their community impact.

## Setup

```bash
npm install
cp .env.example .env.local   # then paste your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

The dashboard, prep page (with a fallback summary), surplus page, and map all work without an API key. Photo logging and the assistant need one.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Claude API (`@anthropic-ai/sdk`) · Recharts · Leaflet/OpenStreetMap · Open-Meteo weather (no key).

## Where things live

| Path | What |
|---|---|
| `src/app/page.tsx` | Dashboard: impact stats, waste trend, most-wasted items |
| `src/app/log/` | Photo → Claude vision → itemized leftovers |
| `src/app/prep/` | Tomorrow's prep forecast (history × events × weather) + Claude summary |
| `src/app/surplus/` | Post surplus, claim pickups, partner directory + map |
| `src/app/assistant/` | Chat assistant that calls tools over the app's data |
| `src/app/api/*` | Route handlers (Claude calls stay server-side) |
| `src/lib/claude.ts` | Claude client, model, and refusal fallback config |
| `src/lib/store.ts` | In-memory store seeded with 35 days of demo history (resets on restart) |
| `src/lib/forecast.ts` | Prep forecast logic |
| `src/lib/impact.ts` | Meals, CO₂, $ saved, tax-deduction estimates |
| `src/lib/data/` | Demo business, menu, partners, local events |

## Demo data notes

- Partners marked `sample: true` are made up. The real organizations have approximate map coordinates, so check them before demoing.
- Events in `src/lib/data/events.ts` are generated relative to today so the forecast always has something to show.
- Impact numbers are estimates: 1.2 lbs per meal (Feeding America), 2.5 kg CO₂e per kg of food waste, and a rough 1.5× deduction multiplier. This is not tax advice.

## Suggested team split

- **A:** Log Waste page and the photo prompt (`api/analyze-waste`)
- **B:** Prep forecast and events (`lib/forecast.ts`, `lib/data/events.ts`)
- **C:** Surplus flow, partners, and map. Stretch goal: real SMS via Twilio in `api/surplus`
- **D:** Dashboard polish, assistant tools (`api/assistant`), and the pitch deck
