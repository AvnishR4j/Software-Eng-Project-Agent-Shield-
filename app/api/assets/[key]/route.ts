import { NextResponse } from "next/server";
import { ensureSchema, runtimeEnv } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const assetId = decodeURIComponent(key);
  if (!runtimeEnv.DB || !runtimeEnv.UPLOADS) return NextResponse.json({ error: "File storage is unavailable." }, { status: 503 });
  await ensureSchema();
  const asset = await runtimeEnv.DB.prepare("SELECT file_name, mime_type, object_key FROM assets WHERE id = ? LIMIT 1").bind(assetId).first<{ file_name: string; mime_type: string; object_key: string }>();
  if (!asset) return NextResponse.json({ error: "File not found." }, { status: 404 });
  const object = await runtimeEnv.UPLOADS.get(asset.object_key);
  if (!object) return NextResponse.json({ error: "File not found." }, { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": asset.mime_type, "Content-Disposition": `attachment; filename="${asset.file_name.replace(/["\r\n]/g, "-")}"`, "Cache-Control": "public, max-age=31536000, immutable" } });
}
