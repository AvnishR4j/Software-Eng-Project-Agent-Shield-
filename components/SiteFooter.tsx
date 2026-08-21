import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { project } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <div className="brand footer-brand"><span className="brand-mark"><ShieldCheck size={18} /></span>AgentShield</div>
          <p>Human control for consequential agent actions.</p>
        </div>
        <div className="footer-links">
          <Link href="/project">Project brief</Link>
          <Link href="/deliverables">Version archive</Link>
          <Link href={project.publisherPortal}>Publisher portal</Link>
          <a href={project.repo} target="_blank" rel="noreferrer">Source repository</a>
        </div>
        <div className="footer-meta">
          <p>{project.course} · {project.courseCode}</p>
          <p>Thapar Institute of Engineering & Technology</p>
          <p>© 2026 AgentShield Team</p>
        </div>
      </div>
    </footer>
  );
}
