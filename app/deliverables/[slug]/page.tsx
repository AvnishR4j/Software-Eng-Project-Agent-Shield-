import { redirect } from "next/navigation";
import { initialDeliverable } from "@/lib/content";
import { listPublishedDeliverables } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function LatestDeliverablePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const items = await listPublishedDeliverables();
  const latest = items.filter((item) => item.slug === slug).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  redirect(latest ? `/deliverables/${slug}/v/${latest.version}` : `/deliverables/${initialDeliverable.slug}/v/${initialDeliverable.version}`);
}
