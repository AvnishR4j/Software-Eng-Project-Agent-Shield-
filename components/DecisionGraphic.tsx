import { ArrowRight, Check, Hand, X } from "lucide-react";

export function DecisionGraphic() {
  return (
    <div className="decision-graphic" aria-label="Action request flows through AgentShield to one of three decisions">
      <div className="request-node">
        <span className="eyebrow">Incoming request</span>
        <strong>refund.issue</strong>
        <small>₹8,000 · customer_1842</small>
      </div>
      <ArrowRight className="flow-arrow" aria-hidden="true" />
      <div className="shield-core">
        <span className="core-rings" aria-hidden="true" />
        <span className="eyebrow">AgentShield</span>
        <strong>Policy decision</strong>
        <small>scope · rules · risk</small>
      </div>
      <div className="decision-stack">
        <div className="decision-pill allow"><Check size={15} /> Allow</div>
        <div className="decision-pill approval"><Hand size={15} /> Require approval</div>
        <div className="decision-pill block"><X size={15} /> Block</div>
      </div>
    </div>
  );
}
