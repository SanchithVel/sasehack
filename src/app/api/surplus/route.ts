import { connection } from "next/server";
import { addSurplus, claimSurplus, store } from "@/lib/store";
import type { SurplusPost } from "@/lib/types";

export async function GET() {
  await connection();
  return Response.json(store.surplus);
}

// POST { items, estLbs, pickupBy } → post surplus for nearby partners.
// In a real build this is where you'd text partners (e.g. Twilio).
export async function POST(req: Request) {
  const body = (await req.json()) as Pick<SurplusPost, "items" | "estLbs" | "pickupBy">;
  return Response.json(addSurplus(body));
}

// PATCH { id, partnerName } → a partner claims the pickup.
export async function PATCH(req: Request) {
  const { id, partnerName } = (await req.json()) as { id: string; partnerName: string };
  const post = claimSurplus(id, partnerName);
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(post);
}
