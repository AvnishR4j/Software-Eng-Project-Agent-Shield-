import { NextResponse } from "next/server";
import { AuthError, requirePublisher } from "@/lib/auth";
import { getStorageBucket, getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_BATCH_SIZE = 200 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "csv", "zip", "png", "jpg", "jpeg", "webp", "md", "txt"]);

type PublishMetadata = {
  title: string; slug: string; type: string; version: string; publishedDate: string;
  authors: string[]; changeSummary: string; commitUrl?: string; deploymentUrl?: string;
  idempotencyKey: string; paths: string[];
};

type UploadedAsset = {
  id: string; object_key: string; relative_path: string; file_name: string;
  mime_type: string; size: number; sha256: string;
};

export async function POST(request: Request) {
  const uploadedKeys: string[] = [];
  try {
    const publisher = await requirePublisher(request);
    const client = getSupabaseServerClient();
    if (!client) throw new Error("Publishing storage is not configured.");
    const form = await request.formData();
    const metadata = parseMetadata(form.get("metadata"));
    const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
    validate(metadata, files);

    const { data: previous } = await client.from("publish_requests").select("version_id").eq("idempotency_key", metadata.idempotencyKey).maybeSingle();
    if (previous) return NextResponse.json({ ok: true, versionId: previous.version_id, duplicate: true });

    const assetRecords: UploadedAsset[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const relativePath = sanitizePath(metadata.paths[index] || file.name);
      const bytes = await file.arrayBuffer();
      const sha256 = await digest(bytes);
      const objectKey = `${metadata.slug}/${metadata.version}/${crypto.randomUUID()}-${relativePath}`;
      const { error } = await client.storage.from(getStorageBucket()).upload(objectKey, bytes, { contentType: file.type || "application/octet-stream", upsert: false, metadata: { publisher: publisher.email, sha256 } });
      if (error) throw error;
      uploadedKeys.push(objectKey);
      assetRecords.push({ id: crypto.randomUUID(), object_key: objectKey, relative_path: relativePath, file_name: file.name, mime_type: file.type || "application/octet-stream", size: file.size, sha256 });
    }

    const { data, error } = await client.rpc("publish_deliverable_version", {
      p_title: metadata.title,
      p_slug: metadata.slug,
      p_type: metadata.type,
      p_version: metadata.version,
      p_published_date: metadata.publishedDate,
      p_authors: metadata.authors,
      p_change_summary: metadata.changeSummary,
      p_commit_url: metadata.commitUrl || null,
      p_deployment_url: metadata.deploymentUrl || null,
      p_publisher_email: publisher.email,
      p_idempotency_key: metadata.idempotencyKey,
      p_assets: assetRecords,
    });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "That version already exists. Choose a new version label." }, { status: 409 });
      throw error;
    }
    const result = data as { version_id?: string; duplicate?: boolean } | null;
    return NextResponse.json({ ok: true, url: `/deliverables/${metadata.slug}/v/${metadata.version}`, versionId: result?.version_id, duplicate: result?.duplicate ?? false });
  } catch (error) {
    const client = getSupabaseServerClient();
    if (client && uploadedKeys.length) await client.storage.from(getStorageBucket()).remove(uploadedKeys);
    const status = error instanceof AuthError ? error.status : error instanceof ValidationError ? 400 : 500;
    const message = error instanceof Error ? error.message : "Publication failed.";
    return NextResponse.json({ error: message }, { status });
  }
}

function parseMetadata(value: FormDataEntryValue | null): PublishMetadata {
  if (typeof value !== "string") throw new ValidationError("Publication metadata is missing.");
  try { return JSON.parse(value) as PublishMetadata; } catch { throw new ValidationError("Publication metadata is invalid."); }
}

function validate(metadata: PublishMetadata, files: File[]) {
  if (!metadata.title?.trim() || !metadata.slug?.match(/^[a-z0-9-]+$/) || !metadata.version?.match(/^v[0-9]+(?:\.[0-9]+){0,2}$/)) throw new ValidationError("Title, lowercase slug and a version such as v1 or v1.1 are required.");
  if (!metadata.publishedDate || !metadata.changeSummary?.trim() || !metadata.authors?.length) throw new ValidationError("Date, author and change summary are required.");
  if (!files.length) throw new ValidationError("Add at least one file or folder.");
  if (files.length !== metadata.paths.length) throw new ValidationError("The uploaded file manifest is incomplete.");
  if (files.reduce((total, file) => total + file.size, 0) > MAX_BATCH_SIZE) throw new ValidationError("The publication exceeds the 200 MB batch limit.");
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(extension)) throw new ValidationError(`${file.name} is not an approved academic file type.`);
    if (file.size > MAX_FILE_SIZE) throw new ValidationError(`${file.name} exceeds the 50 MB file limit.`);
  }
}

function sanitizePath(path: string) { return path.split("/").filter((part) => part && part !== "." && part !== "..").map((part) => part.replace(/[^a-zA-Z0-9._ -]/g, "-")).join("/"); }
async function digest(value: ArrayBuffer) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", value))).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
class ValidationError extends Error {}
