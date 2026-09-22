# Design audit

This is the detailed evidence behind the design-fidelity summary in the
[README](../README.md#response-to-review-feedback). It exists as a separate
file so the README stays skimmable; nothing here duplicates decisions made
elsewhere in the codebase.

**Source material**: three design screenshots supplied directly for this
remediation pass — the live dashboard mockup, and two component-spec pages
(table levels 1–2, table level 3 + row variants). They aren't committed to
this repository (they're the reviewer's own design assets, not licensed for
redistribution) and there is no public URL for them, so they can't be linked
from here. The findings below are the result of that audit; a reviewer who
has the original screenshots can re-check them directly against these
conclusions.

## Confirmed matches

No change needed — already correct before this pass:

- Chart Y-axis ticks
- Card corner radius
- Dashed gridlines
- Legend-below-chart position
- Company row expanded by default in the table
- **X-axis month labels are horizontal**, not rotated (see [_Chart decision_](#chart-decision) below)

## Confirmed mismatches (fixed)

| Finding                                                                                                                                                    | Fix                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Table body text was visibly smaller than the page's 16px default in the design                                                                             | Added a type-scale token (`--font-size-table`, ~13px)                                                                                                        |
| Table rows are alternately shaded in the component spec                                                                                                    | Applied a zebra-stripe background (`--row-stripe-bg`) — see [_Zebra striping_](#zebra-striping) below                                                        |
| Row hover state didn't read consistently across the sticky name column and the rest of the row                                                             | The sticky name cell now inherits the current row's `--row-bg` (zebra stripe or hover), instead of a flat white seam next to the striped/hovered value cells |
| Chart and table card containers had inconsistent treatment (chart: radius + padding, no border; table: radius, no padding, a stray one-sided `border-top`) | Unified via the `Surface` primitive — both get a full 1px border and consistent padding                                                                      |
| The client had zero media queries anywhere                                                                                                                 | Added one breakpoint that steps outer page padding down below 640px                                                                                          |

## Deliberate deviations, kept

### Chart decision

The design's Company-level chart stacks by **acquisition channel** (Existing
clients / New organic / New paid), with a matching legend. The underlying
data doesn't support that breakdown above the individual-employee level —
only one adviser (Anna Blackwood) has channel data at all, so a channel stack
at the Company level would have to be fabricated.

The chart instead stacks **one level below** whatever node it's showing: a
real 3-segment Branch 1 / Branch 2 / Branch 3 stack at the Company level, a
channel stack if pointed at Anna Blackwood specifically, or a single "Total"
bar for any leaf. It's restyled to match the design's non-data visual
language — card treatment, gridlines, legend position and swatch style,
tooltip style, bar corner radius — but deliberately **not** the design's
channel-hex palette: applying `Existing-clients`/`New-organic`/`New-paid`
colors to branch segments would misrepresent what the segments actually are.
The chart uses a separate neutral palette (`--chart-color-1..3`) instead; the
design's own acquisition-channel colors are documented as reference values in
this audit, but are not runtime tokens and are not applied to the branch chart.

X-axis month labels are horizontal in the design, not rotated. An earlier
draft of this README incorrectly claimed the labels were rotated; that
claim was wrong and has been removed — the code has never added an `angle`
prop, and the design confirms 12 horizontal labels fit without collision.

### Chevron decision

Every row gets an expand chevron in the design, even rows with no children
(e.g. every employee, though only Anna Blackwood has channels; Branch 2 and
Branch 3 have no employees). This codebase only renders a toggle where
`getChildren` actually returns something — a chevron with nothing behind it
is a non-functional control. The design's own component-spec screenshot
shows this same mismatch (chevrons on childless rows), confirming it's a
pre-existing inconsistency in the design itself, not a one-off oversight
being second-guessed here.

### Avatar decision

The design's adviser-level rows show a real photo per person in a 20px
circle. The served payload (verbatim from the brief) has no photo field for
any node, and the design file's photos are third-party imagery with no
license to redistribute as static assets. Employee rows instead show a
deterministic initials-on-color avatar: the color is derived from the
employee's `id` (hashed against a small fixed palette, `--avatar-color-1..6`
in `tokens.css`), so each person still reads as visually distinct without
depending on data the API doesn't provide.

### Zebra striping

The component-spec screenshot shows alternating row backgrounds. A subtle
zebra stripe is applied to match. This is the correct read of that
screenshot — the alternating pattern spans multiple non-adjacent, non-hovered
rows, which is inconsistent with a hover state (which is single-row) and
consistent with a static striping pattern.

## Data discrepancies relevant to design fidelity

The brief invites calling out "anything you think we got wrong."
Cross-checking the JSON payload against itself and against the design
screenshots turned up four real discrepancies. The app never derives a
parent's value from its children (or vice versa) — every node always renders
its own `values` from the API, independently at every level — so none of
these are silently "corrected" in the code; they're listed here instead.

1. **Company vs. its branches, May 2024**: Company = `301`, but
   Branch 1 + Branch 2 + Branch 3 = `156 + 87 + 36 = 279` — off by 22.
2. **Branch 1 vs. its employees, Aug 2024**: Branch 1 = `214`, but its five
   employees sum to `216`. The design shows Robert Chen's Aug value as `56`,
   not the JSON's `58` — using `56` reconciles the sum exactly to `214`.
3. **Anna Blackwood's channels vs. her own total**: her three channels don't
   sum to her own `values` in 5 of 12 months (May–Sep). The design's
   "New paid" row differs from the JSON's and reconciles all 12 months —
   this looks like an off-by-one shift introduced when the JSON was
   hand-transcribed from the design.
4. **Branch 1, Jul 2024, shown twice in the design**: `201` in one table
   view, `291` in another — directly visible in the same component-spec
   screenshot. The employee sum for that month is `201`.

**Resolution**: since the served JSON is an exact copy of the brief's
payload (see the README's [_Data model & API_](../README.md#data-model--api)
section), "fixing" it would mean deviating from the given data on this
author's own judgment of what the _real_ number should be. All four are
documented here instead, for whoever owns the source data to verify.
