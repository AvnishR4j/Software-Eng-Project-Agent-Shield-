import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("contains the complete AgentShield homepage and team content", async () => {
  const [page, content, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /AgentShield \| Runtime governance for AI agents/);
  assert.match(page, /Every agent action/);
  assert.match(content, /Avnish Raj/);
  assert.match(content, /Laishram Amarjit/);
  assert.match(content, /Deepanjan Baral/);
  assert.match(content, /Sameer Mathur/);
  assert.match(content, /Project Proposal, Architecture and Feasibility Report/);
  assert.doesNotMatch(`${page}${layout}`, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("ships permanent deliverable assets and removes starter UI", async () => {
  const [layout, page, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /AgentShield/);
  assert.match(layout, /\/og\.png/);
  assert.match(page, /<SiteHeader/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/deliverables/AgentShield_Planning_v1.pdf", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await assert.rejects(access(new URL("../app/_sites-preview/preview.css", import.meta.url)));
});
