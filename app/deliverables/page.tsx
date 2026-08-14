import type { Metadata } from "next";
import { DeliverablesExplorer } from "@/components/DeliverablesExplorer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Deliverables", description: "Every published AgentShield presentation, report and version." };

export default function DeliverablesPage() {
  return (
    <main>
      <SiteHeader />
      <section className="page-hero archive-hero shell">
        <p className="kicker">The semester archive</p>
        <h1>Every version<br />stays visible.</h1>
        <p>Plans evolve. Evidence should not disappear. Every AgentShield deliverable keeps its own permanent page, publication record and place in the project story.</p>
      </section>
      <section className="section shell archive-section"><DeliverablesExplorer /></section>
      <SiteFooter />
    </main>
  );
}
