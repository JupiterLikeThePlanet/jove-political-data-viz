# Contributing to jove-political-data-viz

This skill is MIT licensed and open to contributions. If you've used it,
found a gap, or want to see a new chart type covered — pull requests are
welcome. Strong opinions even more so.

---

## What We're Looking For

Contributions fall into a few categories, all equally useful:

**New chart or map types**
A visualization type not currently in the skill — a margin-trend flip line,
a stacked area race-call chart, a county-level choropleth, a results table
component. See the backlog at the bottom of this file.

**Pattern corrections**
The skill generates code based on its reference files. If you find a case
where the generated output is wrong — wrong library choice, broken animation,
broken tooltip, mismatched data shape — that's a skill gap worth fixing.
The fix usually goes in `references/chart-patterns.md`, `SKILL.md`, or one
of the other reference files, not necessarily in example code.

**Reference file improvements**
Clearer explanations, better code examples, missing edge cases, additional
accessibility patterns.

**Test prompts and iteration log entries**
If you fire a prompt at the skill and get output worth recording — pass or
fail — a log entry in `iteration-log.md` (at the parent level) is a
contribution. That log is the paper trail the skill improves from.

---

## What We're Not Looking For

- Changes to example output files that make them more opinionated without a
  specific failing test case behind them
- Abstraction or refactoring for its own sake — the reference files are
  intentionally concrete and direct
- New dependencies in the skill itself (the skill generates code; it doesn't
  run any)

---

## How to Contribute

1. **Fork** the repo and create a branch off `main`.
   Branch name convention: `feature/chart-type-name` or `fix/what-was-broken`.

2. **Make your change.** See the file structure below for where things live.

3. **Test the skill** — see Testing below.

4. **Open a PR** against `main` with a description that follows the format
   in the PR Template section below.

No CLA required. No issue required before a PR, though opening one first
is a good idea for larger additions so we can align before you spend time
on it.

---

## File Structure

```
jove-political-data-viz/
├── SKILL.md                        # Main skill entry point — chart/map catalog,
│                                   # library selection, model selection, how to respond
├── CONTRIBUTING.md                 # This file
├── README.md                       # Public-facing overview
└── references/
    ├── chart-patterns.md           # Visx implementation patterns (ParentSize, tooltips,
    │                               # animations, crosshair, butterfly bar, rolling average)
    ├── accessibility.md            # ARIA, keyboard navigation, focus ring, screen reader
    ├── map-implementation.md       # Pattern A (D3 owns DOM) vs Pattern B (React owns DOM),
    │                               # small multiples, geographic accuracy rules
    ├── typescript-patterns.md      # Type definitions, theme tokens, adapter functions
    ├── data-fetching-patterns.md   # Single-source and multi-source adapter patterns
    ├── library-comparison.md       # Detailed library trade-offs
    └── examples/                   # Reference component implementations
        ├── candidate-bar-chart.tsx
        ├── us-choropleth-map.tsx
        └── types.ts
```

Most contributions touch `SKILL.md` and/or one file in `references/`. A new
chart type typically means: an entry in `SKILL.md`, a new example in
`references/examples/`, and possibly a new pattern in `chart-patterns.md`.

---

## Testing

The skill is a Claude prompt system, not a code library. There are no unit
tests. Testing means: install the skill, fire a prompt, evaluate the output.

### Install the skill for testing

**Claude.ai:**
1. Zip the `jove-political-data-viz` folder
2. Go to Settings → Capabilities → Skills → Upload Skill

**Claude Code:**
Place the `jove-political-data-viz` folder in your Claude Code skills directory
(typically `~/.claude/skills/`).

### Fire a test prompt

Each chart/map type in `SKILL.md` has a "Test case" line. Use that as your
baseline. Example for the Electoral Vote Donut:

```
Show the current electoral college breakdown as a donut chart. Use
DistributionSlice[] data with three entries: Harris (226 EV, blue),
Toss-up (93 EV, gray), Trump (219 EV, red). Show total EVs in the
center with "270 to win" as a subtext. Add a hover tooltip. Animate
the segments on entry.
```

### Evaluate the output

Ask yourself:

- Did the skill trigger automatically, or did you have to ask for it?
- Did it ask clarifying questions before generating? (It should.)
- Is the generated component complete — types, loading state, error state,
  accessible SVG, tooltip?
- Does it render correctly in a real Next.js app?
- Did the library choice match what `SKILL.md` specifies for this chart type?
- Is the tooltip implemented correctly? (Not inside `ParentSize` — see
  `references/chart-patterns.md` Tooltip Positioning.)

Log the result. A passing result with a new chart type is worth a log entry
as much as a failure is.

### What counts as a passing test

- Component renders without errors
- Tooltip works on hover (not clipped, not displacing layout)
- Animation plays on mount
- The component accepts the canonical data shape from `SKILL.md` without
  modification
- Keyboard navigable where applicable (SVG paths with `tabIndex`, `onKeyDown`)

---

## PR Template

Title format: `[chart-type] what changed` or `[fix] what was broken`

Body:

```
## What this changes
One sentence. What chart/map/pattern does this add or fix?

## Why
What was wrong or missing? If this is based on a failing test, describe
the prompt and what the output got wrong.

## Test prompt used
(paste the exact prompt you fired at the skill)

## Output comparison
- Before: (what the skill generated before this change)
- After: (what it generates now)

## Files changed
- SKILL.md: (what and why)
- references/chart-patterns.md: (what and why)
- etc.
```

Keep PRs focused. One chart type or one pattern correction per PR. If you
have three things to add, open three PRs.

---

## Proposed Additions (Backlog)

These are chart and map types that belong in the skill but aren't covered yet.
If you want to work on one, say so in a GitHub issue first so we don't
duplicate effort.

### Charts

**Margin trend flip line**
A single candidate's margin over time, with the line changing color exactly
where it crosses zero. Good for showing when a state switched partisan lean.
Data shape: `TimeSeriesPoint[]` with a `margin` field per candidate pair.

**Seat projection range chart**
Horizontal bar showing a projected seat count range (min / expected / max)
for a legislative body. Used on election night when projections are uncertain.

**Results table component**
A sortable, filterable table of race results by state or district. Not a chart,
but a common companion to maps. Should handle live-updating data.

**Multi-candidate timeline**
Line chart for more than two candidates over time, with a legend that dims
non-highlighted candidates on hover. Useful for primaries.

### Maps

**County-level choropleth**
Same pattern as the state choropleth but at county resolution. Requires a
county-level TopoJSON and FIPS-to-data mapping. Should support drill-down
from a state-level view.

**Proportional symbol map**
Circles scaled to a numeric value (turnout, raw vote count, fundraising)
overlaid on a base map. Different from choropleth — encodes magnitude, not
category.

**Swing state callout map**
A national map that highlights a predefined set of states (passed as a prop)
with callout labels showing their EV count and current margin. The rest of
the map is dimmed. Common on election night coverage.

### Infrastructure

**Data adapter examples for major providers**
`references/data-fetching-patterns.md` documents the adapter pattern but
doesn't have real-world examples for AP Elections, Decision Desk HQ, or the
NYT results API. Examples (even stubbed) would make the skill more immediately
useful for newsroom work.

**Skill quality rubric**
A checklist for evaluating generated output beyond the current visual QA
checklist — specifically covering: adapter function correctness, TypeScript
strict mode compatibility, and accessibility audit pass/fail.

---

## Questions

Open a GitHub issue or reach me at [jupiterbaudot.dev](https://jupiterbaudot.dev).
