import { connection } from "next/server";
import { addWasteLogs, store } from "@/lib/store";
import type { WasteLog } from "@/lib/types";

export async function GET() {
  await connection();
  return Response.json(store.logs);
}

// POST { items: [...], source } → save confirmed waste entries for today.
export async function POST(req: Request) {
  const { items, source } = (await req.json()) as {
    items: Pick<WasteLog, "name" | "quantity" | "unit" | "estLbs" | "itemId">[];
    source: WasteLog["source"];
  };
  return Response.json(addWasteLogs(items.map((i) => ({ ...i, source }))));
}
