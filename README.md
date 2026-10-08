# Nevis Clients Dashboard

A dashboard over company client-book data with a time-series client chart and an expandable
hierarchical table that drills from company to branch, adviser, and acquisition channel.

> Originally developed as a frontend engineering take-home exercise.

## Overview

The app renders one company's client book as two coordinated views: a stacked chart of client
counts over time, and an expandable table that drills from the whole company down through branch,
adviser, and acquisition channel. The server exposes a single read-only REST endpoint; the client
fetches that payload, derives chart series and visible table rows from it with pure functions, and
renders both views as controlled, presentational components.

## Engineering Highlights

- **React 19 + TypeScript**, built with Vite, data fetching via
  [TanStack Query](https://tanstack.com/query).
- **React Compiler** enabled as a build-time transform (`babel-plugin-react-compiler` on top of
  `@vitejs/plugin-react`'s existing Babel pipeline) — verified by grepping the production build
  output for the compiler's memo-cache guard pattern, not just confirming the plugin is present.
- **Component architecture** that separates data fetching, pure tree/data transformation, and
  presentation into distinct layers (see [Architecture](#architecture)).
- **Pure, independently tested tree/data logic** in `client/src/lib/tree.ts` — child resolution,
  chart-series derivation, and visible-row flattening, all tested without React.
- **Reusable UI primitives** (`Button`, `Avatar`, `Surface`) under `client/src/components/ui/`,
  sitting on a small design-token layer (`client/src/styles/tokens.css`) rather than hardcoded
  values duplicated across components.
- **Accessibility** treated as a first-class concern: native interactive elements, `aria-expanded`,
  accessible naming, and `aria-live` announcements for an interaction that has no native HTML
  equivalent (see [Accessibility](#accessibility)).
- **Responsive handling** for a wide, data-dense table and chart via contained horizontal
  scrolling rather than letting content overflow the page.
- **Automated testing** across pure logic, component rendering/interaction, an integration test,
  and a server smoke test (see [Testing](#testing)).

## Architecture

The codebase is a small npm-workspaces monorepo:

```
client/           React + TS app (Vite)
  src/api/         fetch wrapper
  src/hooks/       useCompanyData (TanStack Query wrapper), useExpandedRows (expand state)
  src/lib/tree.ts  pure functions over the data tree — the core logic, fully unit-tested
  src/styles/      global.css, tokens.css (the token layer)
  src/components/  Dashboard, ClientsChart, ClientsTable (+ ClientRow/RowName/ExpandToggle),
                   StatusView, ui/ (Button, Avatar, Surface)
  src/test/        fixtures, RTL setup, renderWithQuery (fresh QueryClient per test)
server/           Express + TS API
  src/data/        the brief's payload, verbatim, plus the month labels
  src/routes/      GET /api/company
shared/           ClientNode / CompanyResponse types, imported by both client and server
```

The design separates three concerns that are easy to let blur together in a tree-shaped UI:

- **Data fetching** lives in `Dashboard`, via the `useCompanyData` hook (a thin TanStack Query
  wrapper). `Dashboard` also owns expand/collapse state, via `useExpandedRows`.
- **Tree/data transformation logic is isolated** in `client/src/lib/tree.ts` as small, pure,
  independently tested functions — `getChildren(node)` resolves whichever of `branches` /
  `employees` / `channels` a node has; `getChartSeries(node)` / `toChartData(node, months)` derive
  the chart's data; `flattenVisibleRows(root, expandedIds)` computes the table's visible-row list
  given the current expand state.
- **Presentation** is deliberately dumb. `ClientsTable` is a thin, presentational shell — it takes
  an already-flattened row list and renders it, with no state of its own. `ClientsChart` and
  `ClientsTable` are both controlled children of `Dashboard`: they receive data and callbacks, and
  own no fetching or expand-state logic themselves. The table is further split into
  `ClientRow` / `RowName` / `ExpandToggle`, mirroring the component/variant breakdown in the
  provided design file rather than one large row-rendering function.

Client and server share one TypeScript-only workspace, `shared/`, which defines the
`ClientNode` / `CompanyResponse` types both sides import — so the API contract can't drift between
client and server independently.

This split means the tree logic is tested without React at all, the table is tested without a
running chart or API, and `RowName`'s per-level rendering (company / branch / adviser-with-avatar /
channel) is a single, small, swappable piece if the visual design of a given level changes later.

The React Compiler handles render memoization automatically, so `Dashboard` doesn't wrap its
`flattenVisibleRows` call in a manual `useMemo`. `useExpandedRows`'s `useCallback` stays, since it's
part of that hook's public contract (a stable `toggle` reference) rather than a pure render
optimization the compiler subsumes.

## UI & Design Fidelity

The implementation was audited against the design screenshots supplied with the brief (full
evidence in [`docs/design-audit.md`](docs/design-audit.md)). A few concrete visual gaps were found
and fixed: the table's type scale, zebra-striped rows, a row hover state, and the sticky name
column's edge treatment. The audit also found the client had no media queries anywhere; a single
breakpoint now steps the page's own padding down below 640px.

A 13-column table (name + 12 months) and a 12-tick chart can't fit a narrow viewport, so both are
self-contained, horizontally-scrollable regions (`overflow-x: auto`) rather than letting content
force the page itself to overflow. The table's name column and header row are `position: sticky`
so row identity stays visible while scrolling through months.

A few things that looked like gaps turned out to be deliberate, data-driven decisions rather than
shortcuts:

- The **chart** stacks by branch, not by acquisition channel like the design — the underlying data
  doesn't support a channel breakdown above the individual-employee level, so stacking by channel
  at the Company level would mean fabricating data. The chart stacks one level below whatever node
  it's showing instead.
- The **avatar** is a deterministic initials-on-color badge, not a photo — the API has no photo
  field for any node.
- No acquisition-channel colors or breakdowns are fabricated anywhere in the UI to compensate for
  what the data doesn't provide.

## Accessibility

- Every expand/collapse control is a native `<button>`, so Tab/Enter/Space work with no custom key
  handling. The table's horizontal-scroll region has `tabindex="0"` so keyboard users without a
  trackpad can still reach and scroll it (the WAI-ARIA APG "scrollable region" pattern).
- `aria-expanded` is set on both the toggle button and the row; the toggle's accessible name
  carries level and child-count context directly (e.g. _"Expand Branch 1, level 2, 5 employees"_).
- A visually-hidden `aria-live="polite"` region announces every expand/collapse (e.g. "Branch 1
  expanded, 5 rows shown").
- The row's name cell is `<th scope="row">`, so a value cell reads with its row context (e.g.
  "Branch 1, Jul 2024, 201").
- The chart (SVG via Recharts, not meaningfully exposed to screen readers on its own) is marked
  `role="img"` with a descriptive `aria-label`; the table beneath it is the accessible,
  fully-detailed equivalent of the same data.
- One real bug surfaced during testing: a `<th scope="row">` computes its accessible name from all
  nested text content by default, including a nested button's visually-hidden label — so the row
  header's name was initially announcing the toggle's whole label plus the row name. Fixed with an
  explicit `aria-label` on the `<th>`.

## Data & Engineering Decisions

- **The JSON is served verbatim.** `GET /api/company` returns the brief's payload exactly as given
  (`branches` / `employees` / `channels` keys and all), plus a computed `months` array.
- **The hierarchy is fixed-depth** (Company → Branch → Employee → Channel), represented by whichever
  of `branches` / `employees` / `channels` a node has. `getChildren` resolves whichever key is
  present; per-level rendering is driven by depth rather than a separate "kind" field.
- **Parent values are never recomputed from children.** The app does not silently "correct" the
  data — a handful of internal inconsistencies in the served payload (verbatim from the brief) are
  documented in [`docs/design-audit.md`](docs/design-audit.md) rather than papered over.
- **Only Anna Blackwood has `channels`**; Branch 2 and Branch 3 have no `employees`. The UI only
  renders an expand control where `getChildren` actually returns something, rather than rendering a
  chevron on every row regardless of whether it has children.
- **Data fetching** (`client/src/hooks/useCompanyData.ts`) wraps a single
  `useQuery({ queryKey: ['company'], ... })` call. `retry: false` plus a manual `refetch()` wired to
  the error view's retry button gives one attempt on mount and an explicit, user-triggered retry
  rather than Query's default retry-with-backoff. `staleTime: Infinity` and
  `refetchOnWindowFocus: false` are set explicitly, since this dataset is effectively static within
  a session and would otherwise silently refetch on every tab focus.

## Testing

- `client/src/lib/tree.test.ts` — the pure data logic: child resolution, chart series/stacking
  (including the "no channel breakdown → single Total series" fallback), and
  `flattenVisibleRows`'s expand/collapse behavior, including the edge case where a descendant's
  expanded state survives its ancestor being collapsed and later re-expanded.
- `client/src/components/ClientsTable/ClientsTable.test.tsx` — expand/collapse via mouse click and
  via keyboard (Enter and Space), `aria-expanded` on both the button and the row, and that a
  collapsed subtree is fully removed from the DOM (not just visually hidden).
- `client/src/components/ClientsChart/ClientsChart.test.tsx` — series count, series labels, and the
  same fallback behavior for a leaf node, on the actual rendered chart.
- `client/src/components/Dashboard/Dashboard.test.tsx` — an integration test (mocked `fetch`,
  rendered through `renderWithQuery`, which builds a fresh `QueryClient` per test) covering the
  `aria-live` expand announcement counting every row revealed (not just the toggled node's direct
  children), and the error → retry → success path under TanStack Query with `retry: false`.
- `client/src/components/ui/Button.test.tsx` — the one primitive with real behavior to test: click
  handling, disabled state, default `type="button"`, and keyboard focusability.
- `server/src/routes/company.test.ts` — a smoke test on the one real endpoint (status, shape,
  `?simulateError=1`).

## Getting Started

Requires Node.js `>=18.18.0` and npm.

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:4000` and the client on `http://localhost:5173` (Vite
proxies `/api/*` to the server, so the client never needs to know the server's port). Open the
client URL in a browser.

Other useful scripts, runnable from the repo root (each fans out to every workspace that defines
it):

| Script               | What it does                                                              |
| -------------------- | -------------------------------------------------------------------------- |
| `npm test`           | Runs both test suites (server: Vitest + Supertest; client: Vitest + RTL)  |
| `npm run typecheck`  | `tsc --noEmit` across `shared`, `server`, `client`                        |
| `npm run lint`       | ESLint across the whole repo                                              |
| `npm run build`      | Production build (`server` compiles to `dist/`, `client` builds via Vite) |

To run a single workspace's scripts directly, e.g. `npm run test -w client` or
`npm run dev -w server`.

### Exercising the loading/error states manually

The API has a small artificial delay on every response (so the loading state is actually visible
in normal use) and an opt-in failure mode:

```
GET http://localhost:4000/api/company?simulateError=1   # → 500, to see the error UI + retry
```

## Engineering Iteration

Beyond the initial build, the UI was audited against the supplied design screenshots to tighten
visual fidelity (type scale, zebra rows, hover state, sticky-column edges), a shared token layer
and primitive components were introduced where duplication justified it, the React Compiler was
enabled as a build-time transform, and data fetching was migrated to TanStack Query. Accessibility
and interaction behavior were re-verified after each change, with tests and typechecks kept green
throughout.

## What I'd Improve Next

- Sync the chart to the currently-selected/expanded table row, instead of it always showing the
  Company level.
- A full ARIA `treegrid` pattern with roving `tabindex` and arrow-key navigation, for a richer
  screen-reader experience than the current button + `aria-live` approach.
- Virtualize the table if the tree were much larger (it's small enough here that this doesn't
  matter yet).
- A broader responsive redesign for small screens beyond "doesn't overflow" — e.g. collapsing the
  table to fewer visible months by default on narrow viewports.
- Code-split the client bundle (Vite's build already warns it's over the default 500kB chunk size
  guideline, mostly Recharts) if this ever needed a production deploy.

## AI Assistance

Claude Code was used throughout as an engineering assistant: for planning, reviewing the brief and
design screenshots, implementation, and helping surface data discrepancies that were then verified
against the supplied payload and designs. Architectural and product decisions — data handling,
chart stacking behaviour, accessibility, and tooling choices — remained human-owned throughout.
Generated changes were reviewed and validated incrementally, with tests and typechecks kept green
throughout.
