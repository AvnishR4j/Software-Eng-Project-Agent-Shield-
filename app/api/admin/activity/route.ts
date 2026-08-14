import { NextResponse } from "next/server";
import { AuthError, requirePublisher } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const publisher = await requirePublisher(request);
    const client = getSupabaseServerClient();
    if (!client) throw new Error("Publishing database is not configured.");
    const { data, error } = await client.from("audit_events").select("action, actor_email, metadata_json, created_at").order("created_at", { ascending: false }).limit(25);
    if (error) throw error;
    return NextResponse.json({ publisher, activity: (data ?? []).map((item) => ({ ...item, metadata: item.metadata_json })) });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to load activity.";
    return NextResponse.json({ error: message }, { status });
  }
}
