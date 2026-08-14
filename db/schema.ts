import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const deliverables = sqliteTable(
  "deliverables",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    type: text("type").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("idx_deliverables_slug").on(table.slug)],
);

export const versions = sqliteTable(
  "versions",
  {
    id: text("id").primaryKey(),
    deliverableId: text("deliverable_id").notNull().references(() => deliverables.id),
    version: text("version").notNull(),
    publishedDate: text("published_date").notNull(),
    authorsJson: text("authors_json").notNull(),
    changeSummary: text("change_summary").notNull(),
    commitUrl: text("commit_url"),
    deploymentUrl: text("deployment_url"),
    publisherEmail: text("publisher_email").notNull(),
    publishedAt: text("published_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_versions_deliverable_version").on(table.deliverableId, table.version),
    index("idx_versions_published_at").on(table.publishedAt),
  ],
);

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    versionId: text("version_id").notNull().references(() => versions.id),
    objectKey: text("object_key").notNull(),
    relativePath: text("relative_path").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    sha256: text("sha256").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_assets_object_key").on(table.objectKey),
    index("idx_assets_version_id").on(table.versionId),
  ],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    actorEmail: text("actor_email").notNull(),
    deliverableId: text("deliverable_id").notNull(),
    versionId: text("version_id").notNull(),
    metadataJson: text("metadata_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_audit_created_at").on(table.createdAt)],
);

export const publishRequests = sqliteTable("publish_requests", {
  idempotencyKey: text("idempotency_key").primaryKey(),
  versionId: text("version_id").notNull(),
  createdAt: text("created_at").notNull(),
});
