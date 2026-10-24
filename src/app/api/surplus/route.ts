import { connection } from "next/server";
import { getDb, updateDb } from "@/lib/db";
import { COMPOST_TYPES, DONATION_TYPES, milesBetween, PARTNERS } from "@/lib/data/partners";
import type { SurplusPost } from "@/lib/types";

// GET → all pickups plus the business location (for distances and the map).
export async function GET() {
  await connection();
  const db = getDb();
  return Response.json({ posts: db.surplus, profile: db.profile });
}

// POST { kind, items, estLbs, pickupBy } → post surplus for nearby partners.
// In a real build this is where you'd text partners (e.g. Twilio).
export async function POST(req: Request) {
  const body = (await req.json()) as Pick<SurplusPost, "kind" | "items" | "estLbs" | "pickupBy">;
  if (!body.items?.length) return Response.json({ error: "Add at least one item" }, { status: 400 });
  const post: SurplusPost = {
    ...body,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "open",
  };
  updateDb((db) => {
    db.surplus.unshift(post);
  });
  return Response.json(post);
}

// PATCH { id } → simulate the nearest matching partner claiming the pickup.
export async function PATCH(req: Request) {
  const { id } = (await req.json()) as { id: string };
  let claimed: SurplusPost | undefined;
  updateDb((db) => {
    const post = db.surplus.find((p) => p.id === id);
    if (!post || post.status !== "open") return;
    const types = post.kind === "donate" ? DONATION_TYPES : COMPOST_TYPES;
    const nearest = PARTNERS.filter((p) => types.includes(p.type)).sort(
      (a, b) => milesBetween(db.profile, a) - milesBetween(db.profile, b),
    )[0];
    post.status = "claimed";
    post.claimedBy = nearest.name;
    claimed = post;
  });
  if (!claimed) return Response.json({ error: "Pickup not found or already claimed" }, { status: 404 });
  return Response.json(claimed);
}
