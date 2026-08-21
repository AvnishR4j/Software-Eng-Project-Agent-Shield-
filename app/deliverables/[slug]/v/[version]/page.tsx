import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, ExternalLink, FileText, GitCommitHorizontal, History, UserRound } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublishedVersion } from "@/lib/storage";
import { initialDeliverable } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: initialDeliverable.slug, version: initialDeliverable.version }];
}

export default async function DeliverableVersionPage({ params }: { params: Promise<{ slug: string; version: string }> }) {
  const { slug, version } = await params;
  const item = await getPublishedVersion(slug, version);
  if (!item) notFound();
  return (
    <main>
      <SiteHeader />
      <section className="document-hero shell">
        <Link className="back-link" href="/deliverables"><ArrowLeft size={16} /> All deliverables</Link>
        <div className="document-title-row"><div><div className="deliverable-tags"><span>{item.type}</span><span>{item.version}</span><span>Permanent record</span></div><h1>{item.title}</h1></div><div className="version-stamp"><History /><span>Version</span><strong>{item.version}</strong></div></div>
        <p className="document-summary">{item.changeSummary}</p>
      </section>
      <section className="section shell document-layout">
        <div className="document-main">
          <div className="document-section"><p className="kicker">Published files</p><h2>Download this version</h2>
            <div className="asset-list">{item.assets.map((asset) => <a href={asset.downloadUrl} className="asset-row" key={asset.id} download><div className="document-icon"><FileText /></div><div><strong>{asset.fileName}</strong><span>{asset.mimeType} {asset.size ? `· ${formatBytes(asset.size)}` : ""}</span></div><Download size={19} /></a>)}</div>
          </div>
          <div className="document-section"><p className="kicker">What changed</p><h2>Publication note</h2><p className="large-copy">{item.changeSummary}</p><div className="change-list">{item.changes.map((change) => <div key={`${change.kind}-${change.path}`}><span className={`change-kind ${change.kind.toLowerCase()}`}>{change.kind}</span><code>{change.path}</code></div>)}</div><p>This record is immutable. Any correction or evolution will be published as a new version while this URL continues to work.</p></div>
        </div>
        <aside className="document-sidebar">
          <h3>Publication record</h3>
          <div className="record-item"><CalendarDays /><span>Published</span><strong>{formatDate(item.publishedDate)}</strong></div>
          <div className="record-item"><UserRound /><span>Published by</span><strong>{item.publisherEmail}</strong></div>
          <div className="record-item authors"><span>Authors</span>{item.authors.map((author) => <strong key={author}>{author}</strong>)}</div>
          {item.commitUrl && <a className="record-link" href={item.commitUrl} target="_blank" rel="noreferrer"><GitCommitHorizontal /> Related commit <ExternalLink size={14} /></a>}
          {item.deploymentUrl && <a className="record-link" href={item.deploymentUrl} target="_blank" rel="noreferrer"><ExternalLink /> Related deployment <ExternalLink size={14} /></a>}
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}

function formatDate(date: string) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`)); }
function formatBytes(size: number) { return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`; }
