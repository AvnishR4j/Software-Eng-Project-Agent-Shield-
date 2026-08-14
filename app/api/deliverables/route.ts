import { NextResponse } from "next/server";
import { listPublishedDeliverables } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const deliverables = await listPublishedDeliverables();
  return NextResponse.json({ deliverables }, { headers: { "Cache-Control": "public, max-age=30" } });
}
