import Link from "next/link";
import { ArrowUpRight, BookOpen, CheckCircle2, Clock3, Fingerprint, GitBranch, LockKeyhole, ScanSearch } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { DecisionGraphic } from "@/components/DecisionGraphic";
import { TeamGrid } from "@/components/TeamGrid";
import { initialDeliverable, project } from "@/lib/content";

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="hero shell">
        <div className="hero-copy">
          <div className="status-line"><span className="status-dot" /> {project.status} <span>·</span> 12-week academic MVP</div>
          <h1>Every agent action<br /><em>earns trust.</em></h1>
          <p className="hero-lede">AgentShield is the independent control point between autonomous AI agents and the tools they want to use—so high-impact actions are never executed on blind faith.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/project">Explore the project <ArrowUpRight size={17} /></Link>
            <Link className="button button-text" href="/deliverables">View every version <span>→</span></Link>
          </div>
          <div className="hero-trust">
            <span><CheckCircle2 size={15} /> Deterministic policy</span>
            <span><CheckCircle2 size={15} /> Human approval</span>
            <span><CheckCircle2 size={15} /> Immutable audit</span>
          </div>
        </div>
        <div className="hero-visual"><DecisionGraphic /></div>
      </section>

      <section className="signal-band">
        <div className="shell signal-grid">
          <p><span>01</span> Authenticate the agent</p>
          <p><span>02</span> Evaluate permissions</p>
          <p><span>03</span> Route the decision</p>
          <p><span>04</span> Record the outcome</p>
        </div>
      </section>

      <section className="section shell" id="project">
        <div className="section-heading split-heading">
          <div><p className="kicker">The control layer</p><h2>Power needs a boundary.</h2></div>
          <p>Agents can send emails, alter files, issue refunds and call business APIs. AgentShield makes sure capability never outruns accountability.</p>
        </div>
        <div className="principles-grid">
          <article className="principle-card"><span className="number">01</span><LockKeyhole /><h3>Least privilege</h3><p>Every registered agent receives only the tool scopes it genuinely needs.</p></article>
          <article className="principle-card featured"><span className="number">02</span><Fingerprint /><h3>Human authority</h3><p>Sensitive actions pause for the right manager—never a generic approval.</p></article>
          <article className="principle-card"><span className="number">03</span><ScanSearch /><h3>Visible history</h3><p>Requests, decisions, approvals and execution results remain searchable.</p></article>
        </div>
      </section>

      <section className="section shell latest-section">
        <div className="latest-card">
          <div className="latest-main">
            <div className="file-glyph"><BookOpen size={25} /></div>
            <div>
              <p className="kicker">Latest publication</p>
              <h2>{initialDeliverable.title}</h2>
              <p>{initialDeliverable.changeSummary}</p>
            </div>
          </div>
          <div className="latest-meta">
            <div><span>Version</span><strong>{initialDeliverable.version}</strong></div>
            <div><span>Published</span><strong>10 Aug 2026</strong></div>
            <div><span>Authors</span><strong>4 members</strong></div>
          </div>
          <Link className="circle-arrow" href="/deliverables/planning/v/v1" aria-label="Open Planning v1"><ArrowUpRight /></Link>
        </div>
      </section>

      <section className="section team-section" id="team">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><p className="kicker">The people behind the policy</p><h2>Four builders. One shield.</h2></div>
            <div className="instructor-note"><span>Instructor</span><strong>{project.instructor}</strong><a href={`mailto:${project.instructorEmail}`}>{project.instructorEmail}</a></div>
          </div>
          <TeamGrid />
        </div>
      </section>

      <section className="section shell repo-callout">
        <div><p className="kicker">Built in the open</p><h2>Follow the work as it happens.</h2><p>Code, milestones and implementation decisions live in our public repository throughout the semester.</p></div>
        <a className="button button-light" href={project.repo} target="_blank" rel="noreferrer"><GitBranch size={18} /> Open GitHub repository</a>
        <Clock3 className="callout-icon" aria-hidden="true" />
      </section>
      <SiteFooter />
    </main>
  );
}
