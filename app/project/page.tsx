import { AlertTriangle, ArrowRight, Bot, Check, CircleStop, FileClock, Hand, KeyRound, ServerCog, UserCheck } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const workflow = [
  ["01", "Receive", "Structured tool request", Bot],
  ["02", "Authenticate", "Identity and allowed scope", KeyRound],
  ["03", "Evaluate", "Rules, permissions and risk", ServerCog],
  ["04", "Decide", "Allow, block or approval", UserCheck],
  ["05", "Audit", "Record the complete result", FileClock],
] as const;

export default function ProjectPage() {
  return (
    <main>
      <SiteHeader />
      <section className="page-hero shell">
        <p className="kicker">Project brief / 2026</p>
        <h1>Governance at<br />the moment of action.</h1>
        <p>AgentShield sits between an AI agent and controlled tools. It evaluates every request before execution and preserves a complete decision history after it.</p>
      </section>

      <section className="section shell project-intro">
        <div className="section-index">01 / Motivation</div>
        <div className="project-copy">
          <h2>Autonomy changes the risk surface.</h2>
          <p className="large-copy">An agent that can reason is useful. An agent that can act is consequential.</p>
          <p>Direct tool access creates excessive permissions, accidental or malicious actions, inconsistent enforcement and weak accountability. Organizations need an independent runtime boundary that can say yes, no, or “ask a human”—consistently.</p>
        </div>
      </section>

      <section className="dark-section">
        <div className="shell">
          <div className="section-heading split-heading light-heading"><div><p className="kicker">One request. One decision.</p><h2>The control path</h2></div><p>Every branch is audited. Rejected requests never reach a tool; approved requests return to execution exactly once.</p></div>
          <div className="workflow-row">
            {workflow.map(([number, title, body, Icon], index) => (
              <div className="workflow-step" key={title}>
                <div className="workflow-top"><span>{number}</span><Icon size={19} /></div>
                <h3>{title}</h3><p>{body}</p>
                {index < workflow.length - 1 && <ArrowRight className="step-arrow" size={17} />}
              </div>
            ))}
          </div>
          <div className="outcome-grid">
            <article className="outcome allow"><Check /><div><strong>ALLOW</strong><span>Execute the controlled action</span></div></article>
            <article className="outcome approval"><Hand /><div><strong>REQUIRE_APPROVAL</strong><span>Pause for the correct manager</span></div></article>
            <article className="outcome block"><CircleStop /><div><strong>BLOCK</strong><span>Reject without tool execution</span></div></article>
          </div>
        </div>
      </section>

      <section className="section shell scope-section">
        <div className="section-heading"><p className="kicker">MVP boundary</p><h2>Focused enough to finish. Complete enough to prove.</h2></div>
        <div className="scope-grid">
          <div className="scope-column in-scope">
            <div className="scope-label"><Check size={17} /> Included in the 12-week MVP</div>
            {[
              "User, manager and admin roles",
              "Agent registration and allowed tool scopes",
              "Central action-interception REST API",
              "Deterministic permission and policy engine",
              "Optional AI classification for ambiguity",
              "Human approval dashboard and polling",
              "Email, refund and sandbox-file simulators",
              "Append-only audit records and search",
            ].map((item) => <p key={item}>{item}</p>)}
          </div>
          <div className="scope-column out-scope">
            <div className="scope-label"><AlertTriangle size={17} /> Deliberately outside the MVP</div>
            {[
              "Automatic interception of existing agent apps",
              "Operating-system or kernel interception",
              "Real payment and production refund systems",
              "Unrestricted user or company data access",
              "Multiple AI providers in the first build",
              "MCP integration before REST is stable",
              "Enterprise production certification",
              "Deployment before local validation",
            ].map((item) => <p key={item}>{item}</p>)}
          </div>
        </div>
      </section>

      <section className="section shell demo-section">
        <div className="section-heading"><p className="kicker">Demonstration scenarios</p><h2>Three decisions. Measurable outcomes.</h2></div>
        <div className="scenario-table">
          <div className="scenario-row header"><span>Requested action</span><span>Policy</span><span>Expected result</span></div>
          <div className="scenario-row"><strong>Send an internal update</strong><span>Non-sensitive internal email is permitted</span><span className="result allow">ALLOW → execute → audit</span></div>
          <div className="scenario-row"><strong>Issue a refund of ₹8,000</strong><span>Above ₹5,000 requires a manager</span><span className="result approval">PENDING → approve → execute</span></div>
          <div className="scenario-row"><strong>Delete a protected file</strong><span>Protected paths cannot be deleted</span><span className="result block">BLOCK → no execution → audit</span></div>
        </div>
      </section>

      <section className="section shell stack-section">
        <div className="section-heading split-heading"><div><p className="kicker">Implementation</p><h2>A pragmatic academic stack.</h2></div><p>Standard web technologies, controlled simulators and fail-safe defaults keep the MVP feasible for four students.</p></div>
        <div className="stack-list">
          {["React + Vite", "Node.js + Express", "PostgreSQL + Prisma", "JWT + bcrypt", "Vitest + Playwright", "Docker Compose"].map((tech, index) => <span key={tech}><small>{String(index + 1).padStart(2, "0")}</small>{tech}</span>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
