import { NextResponse } from "next/server";
import { getStorageBucket, getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const client = getSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "File storage is not configured." }, { status: 503 });
  const { key } = await params;
  const { data: asset, error } = await client.from("assets").select("file_name, object_key").eq("id", decodeURIComponent(key)).maybeSingle();
  if (error || !asset) return NextResponse.json({ error: "File not found." }, { status: 404 });
  const { data, error: signedUrlError } = await client.storage.from(getStorageBucket()).createSignedUrl(asset.object_key, 60, { download: asset.file_name });
  if (signedUrlError || !data?.signedUrl) return NextResponse.json({ error: "File is temporarily unavailable." }, { status: 503 });
  return NextResponse.redirect(data.signedUrl, { status: 307 });
}
