import Link from "next/link";
import { GitBranch, ShieldCheck } from "lucide-react";
import { project } from "@/lib/content";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link href="/" className="brand" aria-label="AgentShield home">
          <span className="brand-mark"><ShieldCheck size={19} strokeWidth={2.3} /></span>
          <span>AgentShield</span>
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link href="/project">Project</Link>
          <Link href="/deliverables">Deliverables</Link>
          <a href="#team">Team</a>
        </nav>
        <div className="nav-actions">
          <a className="icon-link" href={project.repo} target="_blank" rel="noreferrer" aria-label="AgentShield GitHub repository">
            <GitBranch size={18} />
          </a>
          <Link className="button button-small button-ghost" href="/admin">Publisher portal</Link>
        </div>
      </div>
    </header>
  );
}
