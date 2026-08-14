"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, FileText, Filter } from "lucide-react";
import { initialDeliverable } from "@/lib/content";

type Deliverable = typeof initialDeliverable;

export function DeliverablesExplorer() {
  const [items, setItems] = useState<Deliverable[]>([initialDeliverable]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/deliverables").then(async (response) => response.ok ? await response.json() as { deliverables?: Deliverable[] } : null).then((data) => {
      if (data?.deliverables?.length) setItems(data.deliverables);
    }).catch(() => undefined);
  }, []);

  const filters = useMemo(() => ["All", ...Array.from(new Set(items.map((item) => item.type)))], [items]);
  const filtered = filter === "All" ? items : items.filter((item) => item.type === filter);

  return (
    <>
      <div className="filter-bar"><Filter size={16} /><span>Filter</span>{filters.map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
      <div className="deliverable-list">
        {filtered.map((item, index) => (
          <article className="deliverable-row" key={`${item.slug}-${item.version}`}>
            <div className="deliverable-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="document-icon"><FileText /></div>
            <div className="deliverable-copy">
              <div className="deliverable-tags"><span>{item.type}</span><span>{item.version}</span><span>{formatDate(item.publishedDate)}</span></div>
              <h2>{item.title}</h2>
              <p>{item.changeSummary}</p>
              <div className="author-line">By {item.authors.join(", ")}</div>
            </div>
            <Link className="circle-arrow" href={`/deliverables/${item.slug}/v/${item.version}`} aria-label={`Open ${item.title} ${item.version}`}><ArrowUpRight /></Link>
          </article>
        ))}
      </div>
    </>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}
