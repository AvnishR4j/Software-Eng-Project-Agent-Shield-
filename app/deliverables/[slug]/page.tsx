import Link from "next/link";
import { initialDeliverable } from "@/lib/content";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: initialDeliverable.slug }];
}

export default async function LatestDeliverablePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const target = slug === initialDeliverable.slug ? initialDeliverable : initialDeliverable;

  return (
    <main>
      <SiteHeader />
      <section className="page-hero shell">
        <p className="kicker">Latest version</p>
        <h1>{target.title}</h1>
        <p>{target.changeSummary}</p>
        <Link className="button button-primary" href={`/deliverables/${target.slug}/v/${target.version}`}>
          Open {target.version}
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}
