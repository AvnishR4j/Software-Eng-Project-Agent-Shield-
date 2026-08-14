import { initialDeliverable } from "./content";
import { getSupabaseServerClient } from "./supabase-server";

type VersionRow = {
  id: string;
  version: string;
  published_date: string;
  authors_json: string[];
  change_summary: string;
  commit_url: string | null;
  deployment_url: string | null;
  publisher_email: string;
  published_at: string;
  deliverables: { id: string; slug: string; title: string; type: string } | Array<{ id: string; slug: string; title: string; type: string }>;
};

type AssetRow = {
  id: string;
  relative_path: string;
  file_name: string;
  mime_type: string;
  size: number;
  sha256: string;
  object_key: string;
};

export async function listPublishedDeliverables() {
  const client = getSupabaseServerClient();
  if (!client) return [initialDeliverable];
  const { data, error } = await client
    .from("versions")
    .select("id, version, published_date, authors_json, change_summary, commit_url, deployment_url, publisher_email, published_at, deliverables!inner(id, slug, title, type)")
    .order("published_at", { ascending: false });
  if (error || !data) return [initialDeliverable];
  const rows = data as unknown as VersionRow[];
  return [initialDeliverable, ...rows.map(mapVersionRow)];
}

export async function getPublishedVersion(slug: string, version: string) {
  if (slug === initialDeliverable.slug && version === initialDeliverable.version) return initialDeliverable;
  const client = getSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client
    .from("versions")
    .select("id, version, published_date, authors_json, change_summary, commit_url, deployment_url, publisher_email, published_at, deliverables!inner(id, slug, title, type)")
    .eq("deliverables.slug", slug)
    .eq("version", version)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as VersionRow;
  const deliverable = Array.isArray(row.deliverables) ? row.deliverables[0] : row.deliverables;
  const [{ data: assetData }, { data: previousData }] = await Promise.all([
    client.from("assets").select("id, relative_path, file_name, mime_type, size, sha256, object_key").eq("version_id", row.id).order("relative_path"),
    client.from("versions").select("id").eq("deliverable_id", deliverable.id).lt("published_at", row.published_at).order("published_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const assets = (assetData ?? []) as unknown as AssetRow[];
  let previousAssets: Array<Pick<AssetRow, "relative_path" | "sha256">> = [];
  if (previousData?.id) {
    const { data: previousAssetData } = await client.from("assets").select("relative_path, sha256").eq("version_id", previousData.id);
    previousAssets = (previousAssetData ?? []) as unknown as Array<Pick<AssetRow, "relative_path" | "sha256">>;
  }
  const currentManifest = new Map(assets.map((asset) => [asset.relative_path, asset.sha256]));
  const previousManifest = new Map(previousAssets.map((asset) => [asset.relative_path, asset.sha256]));
  const changes = [
    ...Array.from(currentManifest, ([path, hash]) => ({ kind: previousManifest.has(path) ? (previousManifest.get(path) === hash ? "Unchanged" : "Modified") : "Added", path })).filter((item) => item.kind !== "Unchanged"),
    ...Array.from(previousManifest.keys()).filter((path) => !currentManifest.has(path)).map((path) => ({ kind: "Removed", path })),
  ];
  return {
    ...mapVersionRow(row),
    changes,
    assets: assets.map((asset) => ({
      id: asset.id,
      relativePath: asset.relative_path,
      fileName: asset.file_name,
      mimeType: asset.mime_type,
      size: asset.size,
      sha256: asset.sha256,
      downloadUrl: `/api/assets/${encodeURIComponent(asset.id)}`,
    })),
  };
}

function mapVersionRow(row: VersionRow) {
  const deliverable = Array.isArray(row.deliverables) ? row.deliverables[0] : row.deliverables;
  return {
    id: row.id,
    slug: deliverable.slug,
    title: deliverable.title,
    type: deliverable.type,
    version: row.version,
    publishedDate: row.published_date,
    publishedAt: row.published_at,
    authors: row.authors_json,
    changeSummary: row.change_summary,
    publisherEmail: row.publisher_email,
    commitUrl: row.commit_url,
    deploymentUrl: row.deployment_url,
    changes: [] as Array<{ kind: string; path: string }>,
    assets: [] as Array<{
      id: string; relativePath: string; fileName: string; mimeType: string;
      size: number; sha256: string; downloadUrl: string;
    }>,
  };
}
