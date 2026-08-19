# Nevis Clients Dashboard

A dashboard over a company's client-book data: a stacked bar chart of clients over time, and an
expandable detail table that drills from the whole company down to a branch, an adviser, or an
acquisition channel. Built for the Nevis frontend take-home.

## Stack

- **Client**: React 19 + TypeScript, Vite, [Recharts](https://recharts.org/) for the chart, CSS
  Modules for styling, [Vitest](https://vitest.dev/) + React Testing Library for tests.
- **Server**: Node.js + Express 5 + TypeScript, serving one read-only REST endpoint.
- **Shared**: a small TypeScript-only workspace with the data types both sides import, so the API
  contract can't drift between client and server.
- **Tooling**: npm workspaces (monorepo), ESLint 9 (flat config) with `typescript-eslint`,
  `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y`.

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
  src/hooks/       useCompanyData (fetch/loading/error/retry), useExpandedRows (expand state)
  src/lib/tree.ts  pure functions over the data tree — the core logic, fully unit-tested
  src/components/  Dashboard, ClientsChart, ClientsTable (+ ClientRow/RowName/ExpandToggle), StatusView
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
function.

This split means: the tree logic is tested without React at all, the table is tested without a
running chart or API, and `RowName`'s per-level rendering (company / branch / adviser-with-avatar
/ channel) is a single, small, swappable piece if the visual design of a given level changes later.

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
- `server/src/routes/company.test.ts` — a smoke test on the one real endpoint (status, shape,
  `?simulateError=1`). Deliberately minimal: it's a static payload, so the time was better spent
  on the client-side logic and accessibility above.

## Assumptions & decisions

The brief left several things open on purpose. Here's what was assumed, and why.

### The dataset has internal inconsistencies — found by hand, not assumed away

The brief invites calling out "anything you think we got wrong." Cross-checking the JSON payload
against itself and against the mockup screenshots turned up four real discrepancies:

1. **Company vs. its branches, May 2024**: Company = `301`, but Branch 1 + Branch 2 + Branch 3 =
   `156 + 87 + 36 = 279` — off by 22.
2. **Branch 1 vs. its employees, Aug 2024**: Branch 1 = `214`, but its five employees sum to
   `216`. The mockup screenshot shows Robert Chen's Aug value as `56`, not the JSON's `58` — using
   `56` reconciles the sum exactly to `214`.
3. **Anna Blackwood's channels vs. her own total**: her three channels don't sum to her own
   `values` in 5 of 12 months (May–Sep). The mockup's "New paid" row differs from the JSON's and
   reconciles all 12 months — this looks like an off-by-one shift introduced when the JSON was
   hand-transcribed from the design.
4. **Branch 1, Jul 2024, shown twice in the mockup**: `201` in one table view, `291` in another
   (same screenshot). The employee sum for that month is `201`.

**Resolution**: the app never derives a parent's value from its children (or vice versa) — every
node always renders its own `values` from the API, independently at every level. This sidesteps
the inconsistency rather than silently "correcting" numbers a reviewer might not expect. All four
are listed here rather than fixed in the code, since the served JSON is an exact copy of the
brief's payload (see below) and "fixing" it would mean deviating from the given data on my own
judgment of what the _real_ number should be.

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
- **Only Anna Blackwood has `channels`**; Branch 2 and Branch 3 have no `employees`. The UI
  handles this by only rendering an expand control where `getChildren` actually returns something
  (`hasChildren`), rather than everywhere the mockup shows a chevron — the mockup shows a chevron
  on every row regardless of whether it has children, which would leave non-functional controls
  in the real data. This is a deliberate, documented deviation from the visual mockup.

### The stacked bar chart

The mockup shows the Company-level chart stacked by acquisition channel (Existing clients / New
organic / New paid) with a legend. The data doesn't support that: channel-level breakdown only
exists for one adviser, not for Company or any Branch. Two options were on the table: fabricate a
channel split at levels that don't have one, or stack by something the data actually has.

**Decision**: the chart stacks **one level below** whatever node it's showing — so the
Company-level chart is a real 3-segment stack of Branch 1 / Branch 2 / Branch 3, and the same
component would show a channel stack if pointed at Anna Blackwood, or a single "Total" bar for
any leaf. This satisfies "stacked bar chart" honestly with the data available, rather than
matching the mockup's specific colors by inventing numbers.

The chart itself is **static at the Company level** and doesn't respond to table row
selection/expansion — this matches the mockup's literal layout (one fixed chart above an
independently-expandable table). Syncing the chart to a selected table row is listed under
_What I'd do next_.

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
behavior below, without an extra dependency to reason about or override.

### 375px behavior

Full responsiveness wasn't required, but nothing should overflow the page at 375px. A
13-column table (name + 12 months) and a 12-tick chart can't fit that width, so both are
self-contained horizontally-scrollable regions (`overflow-x: auto` with a sensible `min-width`
on their content) rather than letting content force the page itself to overflow. The table's
name column and header row are `position: sticky` so row identity stays visible while scrolling
through months; the chart's month labels are rotated to reduce collision at narrow widths.

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

## AI assistance

I used Claude Code throughout the implementation as an engineering assistant — for planning, reviewing the brief and mockups, implementation, and helping surface data discrepancies that I then verified against the supplied payload and mockups.

I remained responsible for the architectural and product decisions, including data handling, chart stacking behaviour, accessibility, and tooling choices. I reviewed and validated the generated changes incrementally, with tests and typechecks kept green throughout.
