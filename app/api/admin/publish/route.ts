import { NextResponse } from "next/server";
import { AuthError, requirePublisher } from "@/lib/auth";
import { ensureSchema, runtimeEnv } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_BATCH_SIZE = 200 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "csv", "zip", "png", "jpg", "jpeg", "webp", "md", "txt"]);

type PublishMetadata = {
  title: string;
  slug: string;
  type: string;
  version: string;
  publishedDate: string;
  authors: string[];
  changeSummary: string;
  commitUrl?: string;
  deploymentUrl?: string;
  idempotencyKey: string;
  paths: string[];
};

export async function POST(request: Request) {
  const uploadedKeys: string[] = [];
  try {
    const publisher = await requirePublisher(request);
    if (!runtimeEnv.DB || !runtimeEnv.UPLOADS) throw new Error("Publishing storage is unavailable.");
    await ensureSchema();
    const form = await request.formData();
    const metadata = parseMetadata(form.get("metadata"));
    const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
    validate(metadata, files);

    const previous = await runtimeEnv.DB.prepare("SELECT version_id FROM publish_requests WHERE idempotency_key = ?").bind(metadata.idempotencyKey).first<{ version_id: string }>();
    if (previous) return NextResponse.json({ ok: true, versionId: previous.version_id, duplicate: true });

    const existing = await runtimeEnv.DB.prepare(`SELECT v.id FROM versions v JOIN deliverables d ON d.id = v.deliverable_id WHERE d.slug = ? AND v.version = ?`).bind(metadata.slug, metadata.version).first();
    if (existing) return NextResponse.json({ error: "That version already exists. Choose a new version label." }, { status: 409 });

    const now = new Date().toISOString();
    const deliverableId = `deliverable_${crypto.randomUUID()}`;
    const versionId = `version_${crypto.randomUUID()}`;
    const existingDeliverable = await runtimeEnv.DB.prepare("SELECT id FROM deliverables WHERE slug = ?").bind(metadata.slug).first<{ id: string }>();
    const resolvedDeliverableId = existingDeliverable?.id ?? deliverableId;
    const assetRecords = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const relativePath = sanitizePath(metadata.paths[index] || file.name);
      const bytes = await file.arrayBuffer();
      const sha256 = await digest(bytes);
      const objectKey = `${metadata.slug}/${metadata.version}/${crypto.randomUUID()}-${relativePath}`;
      await runtimeEnv.UPLOADS.put(objectKey, bytes, { httpMetadata: { contentType: file.type || "application/octet-stream" }, customMetadata: { publisher: publisher.email, sha256 } });
      uploadedKeys.push(objectKey);
      assetRecords.push({ id: `asset_${crypto.randomUUID()}`, objectKey, relativePath, fileName: file.name, mimeType: file.type || "application/octet-stream", size: file.size, sha256 });
    }

    const statements = [];
    if (!existingDeliverable) statements.push(runtimeEnv.DB.prepare("INSERT INTO deliverables (id, slug, title, type, created_at) VALUES (?, ?, ?, ?, ?)").bind(resolvedDeliverableId, metadata.slug, metadata.title, metadata.type, now));
    statements.push(runtimeEnv.DB.prepare(`INSERT INTO versions (id, deliverable_id, version, published_date, authors_json, change_summary, commit_url, deployment_url, publisher_email, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(versionId, resolvedDeliverableId, metadata.version, metadata.publishedDate, JSON.stringify(metadata.authors), metadata.changeSummary, metadata.commitUrl || null, metadata.deploymentUrl || null, publisher.email, now));
    for (const asset of assetRecords) statements.push(runtimeEnv.DB.prepare(`INSERT INTO assets (id, version_id, object_key, relative_path, file_name, mime_type, size, sha256, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(asset.id, versionId, asset.objectKey, asset.relativePath, asset.fileName, asset.mimeType, asset.size, asset.sha256, now));
    statements.push(runtimeEnv.DB.prepare("INSERT INTO publish_requests (idempotency_key, version_id, created_at) VALUES (?, ?, ?)").bind(metadata.idempotencyKey, versionId, now));
    statements.push(runtimeEnv.DB.prepare("INSERT INTO audit_events (id, action, actor_email, deliverable_id, version_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(`audit_${crypto.randomUUID()}`, "PUBLISHED", publisher.email, resolvedDeliverableId, versionId, JSON.stringify({ title: metadata.title, slug: metadata.slug, version: metadata.version, files: assetRecords.length }), now));
    await runtimeEnv.DB.batch(statements);
    return NextResponse.json({ ok: true, url: `/deliverables/${metadata.slug}/v/${metadata.version}`, versionId });
  } catch (error) {
    if (runtimeEnv.UPLOADS && uploadedKeys.length) await Promise.all(uploadedKeys.map((key) => runtimeEnv.UPLOADS!.delete(key).catch(() => undefined)));
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
