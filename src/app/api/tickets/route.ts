import { connection } from "next/server";
import { getDb, updateDb } from "@/lib/db";
import { PARTNERS } from "@/lib/data/partners";
import type { Ticket } from "@/lib/types";

// GET → all tickets plus the business location (for distances and the map).
export async function GET() {
  await connection();
  const db = getDb();
  return Response.json({ tickets: db.tickets, profile: db.profile });
}

// POST { kind, partnerId, method, scheduledFor, items, estLbs, notes } → create a ticket.
export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Ticket, "id" | "createdAt" | "status">;
  if (!PARTNERS.some((p) => p.id === body.partnerId)) return Response.json({ error: "Choose where it's going" }, { status: 400 });
  if (!body.items?.length) return Response.json({ error: "Add at least one item" }, { status: 400 });
  const ticket: Ticket = { ...body, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "scheduled" };
  updateDb((db) => {
    db.tickets.unshift(ticket);
  });
  return Response.json(ticket);
}

// PATCH { id, status } → mark a ticket completed or cancelled (or back to scheduled).
export async function PATCH(req: Request) {
  const { id, status } = (await req.json()) as Pick<Ticket, "id" | "status">;
  let updated: Ticket | undefined;
  updateDb((db) => {
    updated = db.tickets.find((t) => t.id === id);
    if (updated) updated.status = status;
  });
  if (!updated) return Response.json({ error: "Ticket not found" }, { status: 404 });
  return Response.json(updated);
}

// DELETE { id } → remove a ticket entirely.
export async function DELETE(req: Request) {
  const { id } = (await req.json()) as { id: string };
  updateDb((db) => {
    db.tickets = db.tickets.filter((t) => t.id !== id);
  });
  return Response.json({ ok: true });
}
