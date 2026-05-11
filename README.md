# White Law Lead Pipeline Dashboard

White Law Lead Pipeline Dashboard is a focused operational dashboard for White Law PLLC. It turns live Law Ruler intake data into a clean daily view of Driver's License Restoration lead flow: who is coming in, where they came from, where they are in the pipeline, and which leads need attention.

The goal is simple: give the firm a single-pane view of pipeline health without forcing staff to inspect Law Ruler row by row.

## What It Shows

The dashboard is built around a DLR-first pipeline view:

- **Total Leads**: the number of visible Driver's License Restoration leads in the selected date range.
- **Conversion Rate**: signed e-sign leads as a share of total DLR leads.
- **Average Days**: average open age for signed leads in the current view.
- **Top Source**: the strongest named attribution source available from Law Ruler.
- **Main Funnel**: lead movement through the core path: New Lead, Sent e-Sign, Signed e-Sign.
- **Branches / Drop-Offs**: side outcomes such as No Viable Case, Reschedule Needed, Appointment Missed, and Lost / Unresponsive.
- **Source Breakdown**: distribution of leads by source, including `Unknown` when Law Ruler has no source recorded.
- **Lead List**: a paginated table with real Law Ruler statuses, source, days open, and recent activity.

## Why It Matters

Law Ruler is the system of record, but its native workflow is primarily lead-by-lead. This dashboard gives the firm a management view:

- Staff can quickly see whether DLR lead volume is healthy.
- Ownership can spot where leads are dropping off.
- Marketing attribution becomes visible without exporting spreadsheets.
- Intake follow-up issues become easier to catch.
- The dashboard becomes a foundation for later PI, Criminal, Clio, and historical reporting work.

## Data Source

All dashboard data comes from the live Law Ruler API.

Current server-side integration:

- `ApiCases/GetInboxItems` provides the DLR lead list and current status.
- `ApiCases/GetLead` enriches leads with source data where available.
- OAuth access tokens are fetched server-side and cached in memory.
- API responses are cached briefly to avoid hammering Law Ruler.
- Browser code never receives Law Ruler credentials or access tokens.

If the Source Breakdown shows `Unknown`, that means the lead is still DLR, but Law Ruler did not return a usable source for that lead.

## Status Handling

The table intentionally shows the actual Law Ruler status after cleaning Law Ruler's trailing `**` marker. For example:

- `Consultation Complete**` displays as `Consultation Complete`.
- `No Viable Case**` displays as `No Viable Case`.
- `Contact Attempted**` displays as `Contact Attempted`.

The funnel still groups related statuses into dashboard buckets so the high-level view stays readable. Status grouping is centralized in:

```text
lib/status-mapping.ts
```

## Timezone Handling

Law Ruler returns datetime values with a UTC-looking offset even when the actual value represents Eastern Time. The dashboard corrects this once at parse time and treats Law Ruler datetimes as `America/New_York`.

The correction lives in:

```text
lib/lawruler.ts
```

## Security

The project is designed so secrets stay server-side.

- Law Ruler credentials are stored in environment variables.
- `.env.local` is ignored by git.
- `.env.example` contains placeholders only.
- Dashboard access is protected by basic auth in deployed environments.
- Local development can disable dashboard auth with `DASHBOARD_AUTH_DISABLED=true`.
- Vercel preview protection is disabled for this project so external firm users can reach the preview URL, then authenticate through the dashboard's own login prompt.

## Environment Variables

Required variables:

```bash
LAW_RULER_BASE_URL=
LAW_RULER_AUTH_URL=
LAW_RULER_CLIENT_ID=
LAW_RULER_CLIENT_SECRET=
LAW_RULER_USERNAME=
LAW_RULER_PASSWORD=

DASHBOARD_USERNAME=
DASHBOARD_PASSWORD=
DASHBOARD_AUTH_DISABLED=false
```

For local review, `.env.local` may set:

```bash
DASHBOARD_AUTH_DISABLED=true
```

Do not use that setting for Vercel preview or production.

## Local Development

Install dependencies:

```bash
npm install
```

Run the dashboard:

```bash
PORT=22000 npm run dev
```

Open:

```text
http://localhost:22000
```

## Verification

Useful checks:

```bash
npm run lint
npm run build
npm run test:e2e
```

The Playwright smoke test checks that the dashboard renders, the lead table filters, and the date range control works.

## Deployment

The project is deployed on Vercel under the `app-build-26` account.

Vercel project:

```text
wl-dashboard
```

GitHub repo:

```text
https://github.com/sirakinb/wl-dashboard-
```

Preview deployments should have:

- Law Ruler env vars configured server-side.
- `DASHBOARD_AUTH_DISABLED=false`.
- Vercel SSO deployment protection disabled, so firm users can access the URL and use dashboard basic auth.

## Build Notes

A fuller build recap is available in:

```text
BUILD_RECAP.md
```

That document summarizes the implementation decisions, Law Ruler API behavior, auth setup, verification steps, and known notes from the first build.
