import { Code2, Contact, Mail } from "lucide-react";
import { members } from "@/lib/content";

export function TeamGrid() {
  return (
    <div className="team-grid">
      {members.map((member, index) => (
        <article className="member-card" key={member.email}>
          <div className={`avatar avatar-${index + 1}`} aria-hidden="true"><span>{member.initials}</span></div>
          <div className="member-copy">
            <p className="member-roll">{member.roll}</p>
            <h3>{member.name}</h3>
            <p className="role-space">Role <span>To be assigned</span></p>
          </div>
          <div className="member-links">
            <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`}><Mail size={17} /></a>
            <a href={member.github} target="_blank" rel="noreferrer" aria-label={`${member.name} on GitHub`}><Code2 size={17} /></a>
            <a href={member.linkedin} target="_blank" rel="noreferrer" aria-label={`${member.name} on LinkedIn`}><Contact size={17} /></a>
          </div>
        </article>
      ))}
    </div>
  );
}
