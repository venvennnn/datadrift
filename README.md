# Data Drift Detector

Catch metric misalignment before it becomes a business decision.

This repository is an MVP demo of an organisational intelligence product. It extracts metric claims from authorised conversations, compares them to registered read-only metric templates, and explains alignment drift — numerical, definition, context, temporal, source, and semantic — without scoring employees.

## What the demo proves

The seeded **July Monthly Business Review** contains:

- Sales: “July approval rate was 47%.”
- Risk: “No, it was 39%.”
- Finance: “The dashboard showed 42%.”

The detector reproduces each figure:

| Claim | What it actually was | Drift |
| --- | --- | --- |
| 47% | Approved / qualified leads (47.2%) | Definition drift. Valid funnel metric, wrong name. |
| 39% | Canonical approved / submitted (39.4%) | Approximately aligned. |
| 42% | Credit Ops dashboard before late-arriving records (42.1%) | Temporal + source drift. |

After the T+2 freeze, the reproducible canonical value is **39.4%**.

## GitHub Pages demo

The app is a static export, so it can be hosted on GitHub Pages at:

**https://venvennnn.github.io/datadrift/**

GitHub Pages cannot run a Node server, so claim extraction, Ask, Slack verification, upload, and resolution all run in the browser against the seeded catalogue.

### Enable Pages (once)

1. In the repo: **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Merge to `main` or run the **Deploy demo to GitHub Pages** workflow

A workflow at `.github/workflows/pages.yml` builds `out/` with `basePath=/datadrift` and publishes it.

Local static preview:

```bash
GITHUB_PAGES=true npm run build
npx serve out
```

Without `GITHUB_PAGES`, `npm run build` still writes a static `out/` folder rooted at `/`.

## Run locally

```bash
npm install
npm test          # verifies the July MBR extraction/comparison scenario
npm run dev       # http://localhost:3000
```

## Product surfaces

- **Overview** — alignment posture and the demonstration narrative
- **Alignment Inbox** — unresolved findings with human resolution
- **Conversation report** — claims, discrepancies, transcript evidence
- **Metric catalogue** — definitions, versions, registered SQL templates
- **Drift map** — team-to-team disagreement, not people ranking
- **Ask the Detector** — evidence-backed questions
- **Slack verification** — on-demand bot that does not post public corrections
- **Transcript upload** — MVP ingestion path from the PRD

## Architecture (demo)

- Next.js App Router + TypeScript + Tailwind
- Deterministic claim extraction and comparison (no unrestricted LLM SQL)
- In-memory store seeded from catalogue + transcripts (stands in for Supabase views, workflow tables, and audit records)
- Registered query templates only; the comparison engine never generates production SQL

Production would swap the in-memory store for Supabase Postgres, add Google/Slack OAuth with source-level ACLs, and use an LLM solely for claim interpretation — never for the authoritative number.
