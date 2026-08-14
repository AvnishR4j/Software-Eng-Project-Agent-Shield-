import { NextResponse } from "next/server";
import { AuthError, requirePublisher } from "@/lib/auth";
import { ensureSchema, runtimeEnv } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const publisher = await requirePublisher(request);
    await ensureSchema();
    const activity = await runtimeEnv.DB!.prepare(`
      SELECT action, actor_email, metadata_json, created_at
      FROM audit_events ORDER BY created_at DESC LIMIT 25
    `).all<Record<string, string>>();
    return NextResponse.json({ publisher, activity: activity.results.map((item: Record<string, string>) => ({ ...item, metadata: JSON.parse(item.metadata_json) })) });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to load activity.";
    return NextResponse.json({ error: message }, { status });
  }
}
