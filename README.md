# Nevis Clients Dashboard

A dashboard over a company's client-book data: a stacked bar chart of clients over time, and an
expandable detail table that drills from the whole company down to a branch, an adviser, or an
acquisition channel. Built for the Nevis frontend take-home.

## Response to review feedback

The first submission got four review points. This is a remediation pass on top of it (the tree
logic, component boundaries, data-discrepancy handling, and accessibility work from the original
submission are unchanged — they were the strongest parts and didn't need rework).

1. **Design fidelity.** A design audit against the supplied Nevis design screenshots found
   concrete visual gaps — table type scale, zebra-striped rows, row hover state, sticky-column
   edge treatment — and fixed them. It also re-examined three things that looked like gaps and
   confirmed them as deliberate, data-driven deviations (chart stacking, chevron behavior, avatar
   fallback). See [_Design fidelity_](#design-fidelity) below and the full evidence in
   [`docs/design-audit.md`](docs/design-audit.md).
2. **"No UI kit."** Added a shared token layer (`client/src/styles/tokens.css`: spacing, radius,
   type, focus-ring, surface, and color tokens) and three primitives — `Button`, `Avatar`,
   `Surface` — under `client/src/components/ui/`, consolidating values that were previously
   duplicated across files or hardcoded as hex arrays inside `.tsx` components. See
   [_UI kit_](#ui-kit) below.
3. **No React Compiler setup.** Added `babel-plugin-react-compiler@1.0.0` to the existing
   `@vitejs/plugin-react@4.7.0` Babel pipeline, deliberately **not** upgrading to `plugin-react@6`,
   which requires Vite 8 + Node ≥20.19 and would break this project's pinned Vite 6 / Node 18.18
   baseline (see [_Tooling versions_](#tooling-versions)). Verified the transform actually runs —
   not just that the plugin is present — by grepping the production build output: `ErrorView`, a
   component with zero manual memoization in its source, compiles to
   `const t = rr.c(7); ... t[0] !== n ? (...) : ...`, the compiler's memo-cache guard pattern.
4. **Use TanStack Query instead of the custom data-fetching hooks.** `useCompanyData` is now a
   thin `useQuery` wrapper; `api/client.ts` (the domain boundary, already accepting an
   `AbortSignal`) is unchanged. `retry: false` plus a manual `refetch()` wired to `ErrorView`'s
   retry button preserves the old hook's exact behavior — one attempt on mount, no silent
   background retries, explicit user-triggered retry — rather than adopting Query's default
   retry-with-backoff, which would have changed the error UX. `staleTime: Infinity` and
   `refetchOnWindowFocus: false` are set explicitly rather than left on Query's defaults (which
   would silently refetch on every tab focus) since this dataset is effectively static within a
   session. See [_Data fetching_](#data-fetching) below.

## Design fidelity

A design audit was run against three design screenshots supplied for this remediation pass (the
live dashboard mockup, and two component-spec pages). It's not committed to this repository — see
[`docs/design-audit.md`](docs/design-audit.md) for why, and for the full evidence behind every
finding below.

**Confirmed and fixed**: the table's type scale, zebra-striped rows, row hover state, and the
sticky name column's edge treatment were genuine gaps between the implementation and the design.
The audit also found the client had zero media queries anywhere; a single breakpoint now steps
the page's own padding down below 640px. All are fixed.

**Re-examined and kept as deliberate deviations** — each one re-checked against the design and
found to be evidence-backed, not a shortcut:

- **Chart** stacks by branch, not by acquisition channel like the design — the data doesn't
  support a channel breakdown above the individual-employee level, so stacking by channel at the
  Company level would mean fabricating data. The chart stacks one level below whatever node it's
  showing instead, restyled to match the design's visual language without borrowing its
  channel-specific palette.
- **Chevron** is only rendered where a row actually has children, unlike the design where every
  row gets one — the design's own component-spec screenshot shows the same childless-row-chevron
  inconsistency, so this isn't a one-off oversight being second-guessed.
- **Avatar** is a deterministic initials-on-color badge, not a photo — the API has no photo field
  for any node, and the design's photos aren't licensed for redistribution as static assets.

The audit also confirmed the chart's **X-axis month labels are horizontal**, matching the code —
an earlier draft of this README incorrectly claimed they were rotated; that claim has been
corrected.

The audit additionally surfaced four internal inconsistencies in the served JSON (verbatim from
the brief) that bear on data-driven design decisions above. The app never derives a parent's value
from its children, so none are silently "corrected" — they're documented in
[`docs/design-audit.md`](docs/design-audit.md) instead.

## UI kit

`client/src/styles/tokens.css` (imported by `global.css`) defines the token layer: a spacing
scale, a type-scale value for table text, a radius scale, a single focus-ring definition (was
duplicated across three files), surface tokens (background/border/radius shared by the chart and
table cards), a zebra-stripe background token, and three separate color palettes that used to be
either unlabeled or living as hex arrays inside `.tsx` components:

- `--channel-existing` / `--channel-organic` / `--channel-paid` — the design's acquisition-channel
  colors, kept for reference but not applied anywhere in the runtime UI (see
  [_Design fidelity_](#design-fidelity)). Previously named `--color-accent`/`-2`/`-3`, which gave
  no indication of what they represented or that the chart deliberately doesn't use them.
- `--chart-color-1..3` — the neutral palette the branch chart actually renders with.
- `--avatar-color-1..6` — the employee-avatar palette, extracted unchanged from `RowName.tsx`'s
  hex array.

`--color-danger` was deleted as genuinely dead code (never referenced); `--color-focus` was
changed from Tailwind blue-600, which didn't belong to this palette, to a value from the same
lavender family as the channel tokens.

Three primitives sit on top of the tokens, under `client/src/components/ui/`:

- **`Button`** — covers both button chromes the app needs (StatusView's bordered text retry
  button, `ExpandToggle`'s icon-only chevron button) via a `variant` prop. No separate
  `IconButton`.
- **`Avatar`** — extracted from `RowName`'s employee initials circle, unchanged visually.
- **`Surface`** — unifies the chart wrapper and table scroll region, which previously had
  inconsistent card treatment (chart: radius + padding, no border; table: radius, no padding, a
  stray `border-top` with nothing on the other three sides). Both now get a full 1px border.

Deliberately **not** built: `Typography`, `StatusMessage`, a separate `IconButton` — each would
exist only to demonstrate the pattern, not because the app has a second consumer for it.

## Stack

- **Client**: React 19 + TypeScript, Vite, [TanStack Query](https://tanstack.com/query) for data
  fetching, the [React Compiler](https://react.dev/learn/react-compiler) (build-time transform via
  `babel-plugin-react-compiler`), [Recharts](https://recharts.org/) for the chart, CSS Modules
  with a small token layer for styling, [Vitest](https://vitest.dev/) + React Testing Library for
  tests.
- **Server**: Node.js + Express 5 + TypeScript, serving one read-only REST endpoint.
- **Shared**: a small TypeScript-only workspace with the data types both sides import, so the API
  contract can't drift between client and server.
- **Tooling**: npm workspaces (monorepo), ESLint 9 (flat config) with `typescript-eslint`,
  `eslint-plugin-react-hooks` (whose `recommended` config already runs the React Compiler's
  static-analysis rules), and `eslint-plugin-jsx-a11y`.

## Getting started

Requires Node.js `>=18.18.0` and npm (no other package manager is needed — see
[_Why npm, not pnpm_](#why-npm-not-pnpm) below).

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:4000` and the client on `http://localhost:5173` (Vite
proxies `/api/*` to the server, so the client never needs to know the server's port). Open the
client URL in a browser.

Other useful scripts, runnable from the repo root (each fans out to every workspace that defines
it):

| Script              | What it does                                                              |
| ------------------- | ------------------------------------------------------------------------- |
| `npm test`          | Runs both test suites (server: Vitest + Supertest; client: Vitest + RTL)  |
| `npm run typecheck` | `tsc --noEmit` across `shared`, `server`, `client`                        |
| `npm run lint`      | ESLint across the whole repo                                              |
| `npm run build`     | Production build (`server` compiles to `dist/`, `client` builds via Vite) |

To run a single workspace's scripts directly, e.g. `npm run test -w client` or
`npm run dev -w server`.

### Exercising the loading/error states manually

The API has a small artificial delay on every response (so the loading state is actually visible
in normal use) and an opt-in failure mode:

```
GET http://localhost:4000/api/company?simulateError=1   # → 500, to see the error UI + retry
```

## Project structure

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

## Component design

`ClientsTable` is deliberately a thin, presentational shell: it takes an already-flattened row
list and renders it, with no state of its own. All the interesting logic — how children resolve
per level, how a node's chart series are derived, and how the tree flattens into visible rows
given a set of expanded ids — lives in `client/src/lib/tree.ts` as small, pure, independently
tested functions:

- `getChildren(node)` — resolves `branches` / `employees` / `channels`, whichever the node has.
- `getChartSeries(node)` / `toChartData(node, months)` — the chart's data mapping.
- `flattenVisibleRows(root, expandedIds)` — the table's visible-row list.

`Dashboard` owns the actual expand/collapse state (`useExpandedRows`) and data fetching
(`useCompanyData`), and composes `ClientsChart` and `ClientsTable` as dumb, controlled children.
The table itself is further split into `ClientRow` / `RowName` / `ExpandToggle`, mirroring the
component/variant breakdown in the provided design file, rather than one large row-rendering
function. `ExpandToggle` and `RowName`'s avatar, along with `StatusView`'s retry button and both
card containers, are built on the `Button` / `Avatar` / `Surface` primitives in
`components/ui/` (see [_UI kit_](#ui-kit)).

This split means: the tree logic is tested without React at all, the table is tested without a
running chart or API, and `RowName`'s per-level rendering (company / branch / adviser-with-avatar
/ channel) is a single, small, swappable piece if the visual design of a given level changes later.

The React Compiler now handles render memoization automatically (verified — see
[_Response to review feedback_](#response-to-review-feedback), point 3), so `Dashboard` no longer
wraps its `flattenVisibleRows` call in a manual `useMemo`. `useExpandedRows`'s `useCallback` stays,
since it's part of that hook's public contract (a stable `toggle` reference) rather than a pure
render optimization the compiler subsumes.

## Accessibility

- **Keyboard**: every expand/collapse control is a native `<button>`, so Tab/Enter/Space work with
  no custom key handling. The table's horizontal-scroll region also has `tabindex="0"` so keyboard
  users without a trackpad can still reach and scroll it (this is the WAI-ARIA APG "scrollable
  region" pattern).
- **Hierarchy reaching assistive tech**: a plain `<tr>`/`<td>` structure has no support for
  `aria-level` (that only works inside `role="treegrid"`, which was out of scope for the time
  budget — see _What I'd do next_). Instead: the row's name cell is `<th scope="row">` so a value
  cell reads as e.g. "Branch 1, Jul 2024, 201"; `aria-expanded` is set on both the toggle button
  and the row; and the toggle's accessible name carries the missing context directly (e.g.
  _"Expand Branch 1, level 2, 5 employees"_). A visually-hidden `aria-live="polite"` region
  announces every expand/collapse ("Branch 1 expanded, 5 rows shown").
- **Chart**: Recharts' SVG output isn't meaningfully exposed to screen readers, so the chart
  container is marked `role="img"` with a descriptive `aria-label` (node name + series names) —
  the table beneath it is the accessible, fully-detailed equivalent of the same data.
- One real bug this surfaced during testing: an `<th scope="row">` computes its accessible name
  from _all_ nested text content by default, including a nested button's visually-hidden label —
  so the row header's name was initially announcing the toggle's whole label plus the row name.
  Fixed with an explicit `aria-label` on the `<th>`.
- Re-verified after the UI-kit refactor (`Button`/`Surface` extraction): `ClientsTable.test.tsx`'s
  exact accessible-name assertions (e.g. `'Expand Branch 1, level 2, 2 employees'`) pass
  unchanged, confirming the refactor didn't touch any accessible name.

## Testing

- `client/src/lib/tree.test.ts` — the pure data logic: child resolution, chart series/stacking
  (including the "no channel breakdown → single Total series" fallback), and
  `flattenVisibleRows`'s expand/collapse behavior, including the edge case where a descendant's
  expanded state survives its ancestor being collapsed and later re-expanded (see _Assumptions_,
  data model).
- `client/src/components/ClientsTable/ClientsTable.test.tsx` — expand/collapse via mouse click and
  via keyboard (Enter and Space), `aria-expanded` on both the button and the row, and that a
  collapsed subtree is fully removed from the DOM (not just visually hidden).
- `client/src/components/ClientsChart/ClientsChart.test.tsx` — series count, series labels, and
  the same-fallback behavior for a leaf node, on the actual rendered chart (Recharts'
  `ResponsiveContainer` is mocked, since jsdom can't measure real layout and it would otherwise
  render nothing).
- `client/src/components/Dashboard/Dashboard.test.tsx` — an integration test (mocked `fetch`,
  rendered through `renderWithQuery`, which builds a fresh `QueryClient` per test so the cache
  can't leak between them) covering a real bug an ultra code review caught: the `aria-live` expand
  announcement must count every row revealed, not just the toggled node's direct children, since a
  descendant can already be expanded from before and resume that state (see _Assumptions_, data
  model). Also covers the error→retry→success path under TanStack Query with `retry: false`.
- `client/src/components/ui/Button.test.tsx` — the one primitive with real behavior to test:
  click handling, disabled state, default `type="button"`, and keyboard focusability. No
  snapshot tests, and no assertions on class names.
- `server/src/routes/company.test.ts` — a smoke test on the one real endpoint (status, shape,
  `?simulateError=1`). Deliberately minimal: it's a static payload, so the time was better spent
  on the client-side logic and accessibility above.

## Assumptions & decisions

The brief left several things open on purpose. Here's what was assumed, and why. (The design and
data-discrepancy deviations are covered above, in [_Design fidelity_](#design-fidelity), since
they're most useful read alongside the feedback they respond to.)

### Data model & API

- **The JSON is served verbatim.** `GET /api/company` returns the brief's payload exactly as
  given (`branches` / `employees` / `channels` keys and all), plus a `months` array
  (`"Feb 2024"` → `"Jan 2025"`) computed once and stored as a literal — the brief states the range
  in prose but the payload itself carries no labels, so the client would otherwise have to
  hardcode month math.
- **A node's children live under one of three keys**, and the tree has a fixed depth
  (Company → Branch → Employee → Channel). `getChildren` resolves whichever key is present;
  `RowName`'s per-level rendering is driven by depth, not a separate "kind" field, since depth
  deterministically maps to a level in this fixed schema.
- **Only Anna Blackwood has `channels`**; Branch 2 and Branch 3 have no `employees`. The UI only
  renders an expand control where `getChildren` actually returns something — see
  [_Design fidelity_](#design-fidelity) for why this deviates from the mockup's chevron-on-every-row.

### Data fetching

`useCompanyData` (`client/src/hooks/useCompanyData.ts`) wraps a single `useQuery({ queryKey:
['company'], ... })` call. The retry/staleness/loading decisions are covered in
[_Response to review feedback_](#response-to-review-feedback), point 4 — this section is just the
pointer, so the reasoning isn't duplicated in two places.

### Tooling versions

A few dependencies had just shipped major versions with tighter Node engine requirements or
breaking changes than this development machine (and plausibly a reviewer's machine) could
satisfy, so versions were deliberately pinned rather than left on `latest`:

- **TypeScript** is pinned to the `5.9` line, not the newly-released `7.x` (a from-scratch native
  compiler) — no track record yet for this project's toolchain.
- **Vite** is pinned to `6.x`; `7.x`/`8.x` require a newer Node than `>=18.18.0`.
- **Vitest** is pinned to `3.x`; `4.x` pulls in a transitive `vite@8`, which reintroduces the same
  Node-version problem even with the client's own Vite pinned to 6.
- **jsdom** is pinned to `26.x`; `30.x` requires a very new Node and crashes on an ESM/CommonJS
  interop issue in one of its own dependencies under this project's Node version.
- **ESLint** is pinned to `9.x`; `10.x` again raises the Node floor. A transitive dependency of
  `typescript-eslint` (`eslint-visitor-keys`) independently needed pinning back to `4.x` for the
  same reason.
- **`@vitejs/plugin-react` is pinned to `4.7.0`, not `6.x`.** `6.x` requires Vite 8 + Node
  ≥20.19, the same problem as above. `babel-plugin-react-compiler` (added for the React Compiler
  build transform — see [_Response to review feedback_](#response-to-review-feedback), point 3)
  works fine on `plugin-react@4.7.0`'s existing Babel pipeline, so there was no need to touch the
  Vite/Node floor to get the compiler running.

All of the above are enforced via root `package.json` `overrides` so a single version resolves
everywhere in the workspace tree, not just at the top level.

### Why npm, not pnpm

Both were considered. pnpm is somewhat more disk-efficient for a monorepo, but this is a
take-home a reviewer needs to run with zero friction — `npm install` needs nothing beyond Node
itself, while pnpm would need either a global install or `corepack enable` first. Repository size
here (three tiny workspaces) doesn't benefit meaningfully from pnpm's content-addressable store
anyway, so the simpler, zero-setup option won.

### Styling

CSS Modules, no framework — full control over focus states, sticky columns, and the 375px
behavior below, without an extra dependency to reason about or override. A small token layer
(`tokens.css`) and three primitives sit on top — see [_UI kit_](#ui-kit) — rather than adopting a
component library, since the app's actual surface area (one table, one chart, a handful of
status views) doesn't need one.

### 375px behavior

Full responsiveness wasn't required, but nothing should overflow the page at 375px. A
13-column table (name + 12 months) and a 12-tick chart can't fit that width, so both are
self-contained horizontally-scrollable regions (`overflow-x: auto` with a sensible `min-width`
on their content) rather than letting content force the page itself to overflow. The table's
name column and header row are `position: sticky` so row identity stays visible while scrolling
through months; **the chart's month labels stay horizontal** — the design confirms 12 horizontal
labels fit without collision (see [_Design fidelity_](#design-fidelity)), so no rotation was
added. One additional gap the audit found: the client had zero media queries anywhere. A single
breakpoint now steps the page's own padding down below 640px — the chart and table already
contained their own horizontal scroll regardless of viewport width, so this only affects the
outer page padding, not that contained-scroll behavior.

## What I'd do next

- Sync the chart to the currently-selected/expanded table row, instead of it always showing the
  Company level.
- A full ARIA `treegrid` pattern with roving `tabindex` and arrow-key navigation, for a richer
  screen-reader experience than the current button + `aria-live` approach — this was the right
  tradeoff for the time budget, but a real tree widget is the more complete answer.
- Virtualize the table if the tree were much larger (it's small enough here that this doesn't
  matter yet).
- A loading skeleton that matches the final chart/table layout, instead of a plain loading
  message.
- A broader responsive redesign for small screens beyond "doesn't overflow" — e.g. collapsing the
  table to fewer visible months by default on narrow viewports.
- Verify the four data discrepancies above with whoever owns the source data, and decide whether
  the API should eventually reconcile them or keep serving the raw values as-is.
- Code-split the client bundle (Vite's build already warns it's over the default 500kB chunk
  size guideline, mostly Recharts) if this ever needed a real production deploy.

## AI assistance

I used Claude Code throughout the implementation — including this remediation pass — as an
engineering assistant: for planning, reviewing the brief and design screenshots, implementation,
and helping surface data discrepancies that I then verified against the supplied payload and
designs.

I remained responsible for the architectural and product decisions, including data handling,
chart stacking behaviour, accessibility, and tooling choices. I reviewed and validated the
generated changes incrementally, with tests and typechecks kept green throughout.
