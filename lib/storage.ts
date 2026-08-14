import { env } from "cloudflare:workers";
import { initialDeliverable } from "./content";

type RuntimeEnv = {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
};

export const runtimeEnv = env as RuntimeEnv;

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!runtimeEnv.DB) throw new Error("Database binding is unavailable.");
  if (schemaReady) return schemaReady;
  const db = runtimeEnv.DB;
  schemaReady = db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS deliverables (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
      type TEXT NOT NULL, created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY, deliverable_id TEXT NOT NULL, version TEXT NOT NULL,
      published_date TEXT NOT NULL, authors_json TEXT NOT NULL, change_summary TEXT NOT NULL,
      commit_url TEXT, deployment_url TEXT, publisher_email TEXT NOT NULL,
      published_at TEXT NOT NULL, UNIQUE(deliverable_id, version)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY, version_id TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE,
      relative_path TEXT NOT NULL, file_name TEXT NOT NULL, mime_type TEXT NOT NULL,
      size INTEGER NOT NULL, sha256 TEXT NOT NULL, created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY, action TEXT NOT NULL, actor_email TEXT NOT NULL,
      deliverable_id TEXT NOT NULL, version_id TEXT NOT NULL,
      metadata_json TEXT NOT NULL, created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS publish_requests (
      idempotency_key TEXT PRIMARY KEY, version_id TEXT NOT NULL, created_at TEXT NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_versions_published_at ON versions(published_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_assets_version_id ON assets(version_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_events(created_at)"),
  ]).then(() => undefined);
  return schemaReady;
}

export async function listPublishedDeliverables() {
  if (!runtimeEnv.DB) return [initialDeliverable];
  try {
    await ensureSchema();
    const rows = await runtimeEnv.DB.prepare(`
      SELECT d.id, d.slug, d.title, d.type, v.id AS version_id, v.version,
        v.published_date, v.authors_json, v.change_summary, v.commit_url,
        v.deployment_url, v.publisher_email, v.published_at
      FROM deliverables d JOIN versions v ON v.deliverable_id = d.id
      ORDER BY v.published_at DESC
    `).all<Record<string, string>>();
    return [initialDeliverable, ...rows.results.map(mapVersionRow)];
  } catch {
    return [initialDeliverable];
  }
}

export async function getPublishedVersion(slug: string, version: string) {
  if (slug === initialDeliverable.slug && version === initialDeliverable.version) return initialDeliverable;
  if (!runtimeEnv.DB) return null;
  try {
    await ensureSchema();
    const row = await runtimeEnv.DB.prepare(`
      SELECT d.id, d.slug, d.title, d.type, v.id AS version_id, v.version,
        v.published_date, v.authors_json, v.change_summary, v.commit_url,
        v.deployment_url, v.publisher_email, v.published_at
      FROM deliverables d JOIN versions v ON v.deliverable_id = d.id
      WHERE d.slug = ? AND v.version = ? LIMIT 1
    `).bind(slug, version).first<Record<string, string>>();
    if (!row) return null;
    const assetRows = await runtimeEnv.DB.prepare(`
      SELECT id, relative_path, file_name, mime_type, size, sha256, object_key
      FROM assets WHERE version_id = ? ORDER BY relative_path
    `).bind(row.version_id).all<Record<string, string | number>>();
    const previous = await runtimeEnv.DB.prepare(`
      SELECT id FROM versions
      WHERE deliverable_id = ? AND published_at < ?
      ORDER BY published_at DESC LIMIT 1
    `).bind(row.id, row.published_at).first<{ id: string }>();
    const previousAssets = previous
      ? await runtimeEnv.DB.prepare("SELECT relative_path, sha256 FROM assets WHERE version_id = ?").bind(previous.id).all<{ relative_path: string; sha256: string }>()
      : { results: [] as Array<{ relative_path: string; sha256: string }> };
    const currentManifest = new Map(assetRows.results.map((asset: Record<string, string | number>) => [String(asset.relative_path), String(asset.sha256)]));
    const previousManifest = new Map(previousAssets.results.map((asset: { relative_path: string; sha256: string }) => [asset.relative_path, asset.sha256]));
    const changes = [
      ...Array.from(currentManifest, ([path, hash]) => ({ kind: previousManifest.has(path) ? (previousManifest.get(path) === hash ? "Unchanged" : "Modified") : "Added", path })).filter((item) => item.kind !== "Unchanged"),
      ...Array.from(previousManifest.keys()).filter((path) => !currentManifest.has(path)).map((path) => ({ kind: "Removed", path })),
    ];
    return {
      ...mapVersionRow(row),
      changes,
      assets: assetRows.results.map((asset: Record<string, string | number>) => ({
        id: String(asset.id),
        relativePath: String(asset.relative_path),
        fileName: String(asset.file_name),
        mimeType: String(asset.mime_type),
        size: Number(asset.size),
        sha256: String(asset.sha256),
        downloadUrl: `/api/assets/${encodeURIComponent(String(asset.id))}`,
      })),
    };
  } catch {
    return null;
  }
}

function mapVersionRow(row: Record<string, string>) {
  return {
    id: row.version_id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    version: row.version,
    publishedDate: row.published_date,
    publishedAt: row.published_at,
    authors: JSON.parse(row.authors_json) as string[],
    changeSummary: row.change_summary,
    publisherEmail: row.publisher_email,
    commitUrl: row.commit_url || null,
    deploymentUrl: row.deployment_url || null,
    changes: [],
    assets: [],
  };
}
