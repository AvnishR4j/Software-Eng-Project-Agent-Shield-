# AgentShield

AgentShield is a provider-independent runtime security and governance gateway for AI-agent tool actions. This repository contains the UCS503 Software Engineering team website, its immutable deliverables archive, and the protected publishing portal used throughout the semester.

## Website capabilities

- Public project brief, architecture, MVP boundary, scenarios and team profiles
- Permanent page for every presentation, report and deliverable version
- Passwordless publisher access restricted to the four team members and instructor
- Drag-and-drop file and folder publishing with progress and validation
- Supabase Postgres metadata, append-only activity history and private Supabase file storage
- SHA-256 file manifests and added/modified/removed change tracking
- Responsive, keyboard-accessible interface and branded social preview

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local`, add the Supabase public and server credentials, and apply `supabase/migrations/202608150001_agentshield_publishing.sql`. The five approved users must already exist in Supabase Auth; public signup is disabled.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm test
```

The production site is deployed through Vercel. Supabase provides passwordless authentication, relational version records and private deliverable storage.

## Team

- Avnish Raj — 1024170125
- Laishram Amarjit — 1024170129
- Deepanjan Baral — 1024170053
- Sameer Mathur — 1024170132

Instructor: Dr. Sukhpal Singh  
Course: Software Engineering — UCS503
