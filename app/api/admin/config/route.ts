import { NextResponse } from "next/server";
import { runtimeEnv } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = runtimeEnv.SUPABASE_URL ?? "";
  const key = runtimeEnv.SUPABASE_PUBLISHABLE_KEY ?? "";
  return NextResponse.json({ configured: Boolean(url && key), url, key });
}
