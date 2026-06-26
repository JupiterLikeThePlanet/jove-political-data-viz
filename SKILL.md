---
name: jove-political-data-viz
description: >
  Political and election data visualization for React and TypeScript.
  Generates complete working components, not just code snippets.
  Use when user says: build a chart, create a map, show polling data,
  compare candidates, display election results, visualize exit polls,
  which chart should I use, which library should I use.
license: MIT
metadata:
  author: Jupiter Baudot
  version: 1.0.0
  github: https://github.com/JupiterLikeThePlanet/claude-skill-political-data-viz
  signature: jove
---

# jove-political-data-viz

A Claude skill for building political and election data visualizations
in React and TypeScript. Designed for political analysts, data analysts,
and exit poll analysts.

## What This Skill Delivers
- Recommends the right chart type based on your data shape and goal
- Recommends the right library based on complexity and newsroom standards
- Handles single-source and multi-source aggregation pipelines
- Normalizes data from any major election data provider into consistent shapes
- Components follow NYT/Visx production standards
- TypeScript throughout, accessible by default

## Library Selection Guide

Match library to chart complexity and use case. Default to Visx for
anything targeting production newsroom quality.

### Chart Libraries

| Library | Use When | Model |
|---|---|---|
| Visx | Custom high-fidelity charts, full control over styling and layout | Sonnet 4.6 |
| Recharts | Fast builds, standard bar/line/pie, internal or lower-stakes views | Haiku 4.5 |
| Lightweight Charts | Real-time updating data, live election night feeds | Sonnet 4.6 |
| D3 | Maximum custom control when no other library can do it | Opus 4.8 |
| Chart.js | Not recommended — canvas-based, poor CSS composability, no SVG control | — |

### Map Libraries

| Library | Use When | Model |
|---|---|---|
| react-simple-maps | National and state choropleth, covers 90% of map use cases | Sonnet 4.6 |
| D3 + TopoJSON | District-level maps, county drill-down, maximum fidelity | Opus 4.8 |
| Mapbox | Terrain or satellite context required | Opus 4.8 |

### Model Selection Guide

| Model | Use For |
|---|---|
| Haiku 4.5 | Simple single-metric charts. Bar, pie, donut. Flat data, self-contained component under ~100 lines |
| Sonnet 4.6 | Default for most charts. Polling trends, area charts, grouped bars, national maps, multi-source fetching, data adapters |
| Opus 4.8 | D3 district maps, full dashboards, production-ready multi-panel components requiring first-pass quality |

### Quick Decision Flow

```
What are you building?
│
├── A map?
│   ├── National or state level → react-simple-maps + Sonnet 4.6
│   └── District or county level → D3 + TopoJSON + Opus 4.8
│
├── A chart?
│   ├── Simple, one metric → Recharts + Haiku 4.5
│   ├── Polling trend over time → Visx + Sonnet 4.6
│   ├── Exit poll comparison → Visx + Sonnet 4.6
│   └── Full live dashboard → Visx + Lightweight Charts + Opus 4.8
│
└── Not sure?
    └── Describe your data → skill will recommend
```
## Chart and Map Type Guide

Match visualization type to data shape and analytical goal. Each entry
includes a use case, recommended library, model, and canonical data shape.

Races covered: gubernatorial, senate, house of representatives.
The district level (House) is the most complex — see Map Rendering Strategy.

---

### Charts

#### Candidate Comparison Bar Chart
**Use when:** Comparing vote share, polling percentage, or fundraising
across candidates at a single point in time.
**Trigger phrases:** "compare candidates", "who is leading", "side by side"
**Library:** Recharts (simple) or Visx (production)
**Model:** Haiku 4.5 (Recharts) / Sonnet 4.6 (Visx)
**Data shape:**
```ts
type ComparisonGroup = {
  label: string                    // candidate name or demographic
  values: Record<string, number>   // { harris: 48.2, trump: 45.1 }
  total?: number
}
```
**Test case:** "I have polling data for 4 candidates in Arizona. Build a bar chart."

---

#### Polling Trend Line
**Use when:** Showing how candidate support changes over time. Single or
multi-source. FiveThirtyEight style — individual poll dots overlaid on
an aggregate trend line.
**Trigger phrases:** "polling trend", "over time", "show movement", "aggregate polls"
**Library:** Visx
**Model:** Sonnet 4.6
**Data shape:**
```ts
type TimeSeriesPoint = {
  date: string                         // ISO 8601
  candidates: Record<string, number>   // { harris: 48.2, trump: 45.1 }
  source?: string                      // originating data provider
  isStale?: boolean
}
```
**Test case:** "I have 90 days of polling data from 3 sources for 2 candidates. Build a trend line."

---

#### Vote Share Area Chart
**Use when:** Showing how the composition of the vote shifts over time.
Good for illustrating momentum and crossover points.
**Trigger phrases:** "vote share", "composition over time", "stacked"
**Library:** Visx
**Model:** Sonnet 4.6
**Data shape:** Same as TimeSeriesPoint above. Rendered as stacked areas.
**Test case:** "Show me how vote share has shifted between 3 candidates over 6 months."

---

#### Exit Poll Grouped Bar
**Use when:** Breaking down candidate support by demographic groups —
age, gender, education, race. Multi-variable comparison.
**Trigger phrases:** "exit poll", "by demographic", "breakdown", "groups"
**Library:** Visx
**Model:** Sonnet 4.6
**Data shape:**
```ts
type ComparisonGroup = {
  label: string                    // "Women 18-29", "College educated"
  values: Record<string, number>   // { harris: 62, trump: 31, other: 7 }
  total?: number
}
```
**Test case:** "I have exit poll data broken down by age and gender across 3 candidates. Build a grouped bar chart."

---

#### Electoral Vote Donut
**Use when:** Showing distribution of electoral votes, senate seats, or
house seats. Simple proportional display.
**Trigger phrases:** "electoral votes", "seat count", "distribution", "donut", "pie"
**Library:** Recharts (simple, static) or Visx (production, any hover state)
**Model:** Haiku 4.5 (Recharts, static only) / Sonnet 4.6 (Visx, any hover state)
**Data shape:**
```ts
type DistributionSlice = {
  label: string      // "Democratic", "Republican", "Uncalled"
  value: number      // seat or electoral vote count
  color?: string     // hex color — provide or skill will apply defaults
}
```
**Note:** If building with Visx and hover tooltips, the tooltip must render
outside `ParentSize` using `position: fixed` — see references/chart-patterns.md
Tooltip Positioning section. Do not use `TooltipWithBounds` inside `ParentSize`.
**Test case:** "Show the current electoral college breakdown as a donut chart."

---

#### Multi-Source Real-Time Polling
**Use when:** Fetching from multiple data providers simultaneously,
merging results, showing per-source error states and stale indicators.
**Trigger phrases:** "real-time", "live", "multiple sources", "election night", "feed"
**Library:** Visx + Lightweight Charts
**Model:** Opus 4.8
**Data shape:** Array of TimeSeriesPoint per source, merged on render.
Each source tracked independently for error and stale state.
**Test case:** "Fetch polling data from 4 sources every 30 seconds. Show a live trend line with a stale indicator if a source stops responding."

---

#### Toggleable Bar Chart
**Use when:** The user wants to switch between two variables on the same
chart without rebuilding. Good for comparing turnout vs. vote share,
or 2020 vs. 2024 results by state.
**Trigger phrases:** "toggle", "switch between", "compare two metrics", "flip"
**Library:** Recharts or Visx
**Model:** Sonnet 4.6
**Data shape:** Same as ComparisonGroup — two datasets passed in, toggle
controls which is active.
**Test case:** "Build a bar chart that toggles between 2020 and 2024 turnout by state."

---

### Maps

#### National Choropleth — State Level
**Use when:** Coloring all 50 states by winner, margin, or metric.
Gubernatorial and Senate races. The standard election night map.
**Trigger phrases:** "which states are red and blue", "state map", "national map", "color by winner"
**Library:** react-simple-maps
**Model:** Sonnet 4.6
**Rendering pattern:** Pattern B — React renders SVG, D3 handles projection math
**Data shape:**
```ts
type GeoFeature = {
  id: string         // state FIPS code or two-letter abbreviation
  candidate: string  // winning or leading candidate
  margin: number     // win margin as percentage
  color: string      // resolved hex — skill applies red/blue defaults
  tooltip: string    // pre-formatted hover text
}
```
**Test case:** "Color each state by the leading candidate with a hover tooltip showing margin."

---

#### Choropleth with Zoom to Bounding Box — State Drill-Down
**Use when:** National view with click-to-zoom into a state. Reveals
county or district detail at the zoomed level. Correct pattern for
House of Representatives races at national scale.
**Trigger phrases:** "click to zoom", "drill down", "zoom into state", "district detail"
**Library:** D3 + TopoJSON
**Model:** Opus 4.8
**Rendering pattern:** Pattern A — D3 owns the DOM inside useEffect.
React is a container only. Translates directly from Observable notebook patterns.
**Note:** At national scale, House districts in dense urban areas are
sub-pixel. Always use zoom drill-down for district-level House data.
**Test case:** "Build a national map. Clicking a state zooms in and shows congressional districts colored by winner."

---

#### Square Cartogram
**Use when:** Showing state-level results where geographic size would
distort importance. Each state represented as an equal-sized square.
Wyoming and California read as equally important.
**Trigger phrases:** "cartogram", "hexmap", "equal area", "square map"
**Library:** D3 + TopoJSON
**Model:** Opus 4.8
**Rendering pattern:** Pattern A
**Test case:** "Build a cartogram where each state is a square colored by the winning candidate."

---

## Map Rendering Strategy

Two patterns are used depending on map complexity. Do not mix them
in the same component.

**Pattern A — D3 owns the DOM**
Use for: district-level maps, zoom to bounding box, raster tile overlays,
cartograms.
D3 runs inside `useEffect` and mutates an SVG ref directly.
React provides a container `div` only.
Observable notebook code translates to this pattern with minimal changes.
```tsx
const DistrictMap = ({ data }) => {
  const svgRef = useRef(null)
  useEffect(() => {
    const svg = d3.select(svgRef.current)
    // all D3 rendering logic here
  }, [data])
  return <div ref={svgRef} />
}
```

**Pattern B — React owns the DOM**
Use for: national choropleth, graduated symbols, react-simple-maps components.
D3 handles projections and path math only. React renders all SVG elements.
Integrates cleanly with useState, props, and TanStack Query.
```tsx
const StateMap = ({ data }) => {
  const projection = d3.geoAlbersUsa()
  const pathGenerator = d3.geoPath(projection)
  return (
    <svg>
      {data.features.map(feature => (
        <path
          key={feature.id}
          d={pathGenerator(feature)}
          fill={getColor(feature)}
        />
      ))}
    </svg>
  )
}
```

---

## Data Normalization

All components expect a canonical internal shape. Raw API responses
must be passed through an adapter function before reaching a component.
Never pass raw API data directly to a chart or map.

### Adapter Pattern
```
Raw API response → adapterFn() → canonical shape → component
```

This applies to both single-source and multi-source flows.
For multi-source, run each response through its own adapter,
then merge the normalized results before passing to the component.

```
AP response   → apAdapter()  ─┐
Fox response  → foxAdapter() ─┼─→ merge() → canonical shape → chart
NBC response  → nbcAdapter() ─┘
```

See `references/data-fetching-patterns.md` for adapter examples
per data provider and per chart category.

## How to Respond

Follow this three-step flow every time the skill is invoked.
Do not skip steps. Do not generate code before Step 2 is confirmed.

---

### Step 1 — Clarify

Ask only what is needed to make a good recommendation.
Do not ask more than three questions at once.

Always determine:
- What race or data type is involved (gubernatorial, senate, house, exit poll, polling trend)
- Whether data is single-source or multi-source
- Whether the component is for a live feed or static display

Ask if unclear:
- What the data shape looks like or what API it is coming from
- Whether a library preference exists
- Whether this is for internal use or production analyst-facing output

---

### Step 2 — Recommend

Before writing any code, state:
- Which chart or map type and why
- Which library and why
- Which model is appropriate for the complexity
- Which data shape the component will expect
- Whether an adapter function is needed

Format the recommendation clearly. Example:

> **Recommended:** Polling Trend Line — Visx — Sonnet 4.6
> Your data is time-series with multiple candidates and three sources.
> Visx gives you the control needed for production newsroom output.
> Data will be normalized to TimeSeriesPoint before rendering.
> An adapter function is needed for each source.

Wait for confirmation before proceeding to Step 3.

---

### Step 3 — Build

Generate a complete working component. Never generate partial code
or pseudocode unless explicitly asked.

Every generated component must include:
- TypeScript types for all props and data shapes
- Data adapter function if raw API data is involved
- Loading state
- Error state
- Empty/no-data state
- Hover tooltip where applicable
- ARIA labels on SVG elements
- Responsive width handling via ParentSize from @visx/responsive — see references/chart-patterns.md

If multi-source — include:
- Per-source error state
- Stale data indicator with timestamp
- Merged normalized data before render

After generating, state:
- What mock data shape to use for testing
- Which dependencies to install
- Any environment variables required

## Accessibility Rules

Every generated component must meet these requirements.
Apply them in Step 3 without being asked.

### SVG
- Wrap every SVG in a element with a descriptive title
- Add role="img" and aria-labelledby pointing to the title id
- Never rely on color alone to convey meaning — use labels, patterns, or text

### Interactive Elements
- All tooltips must be keyboard accessible, not hover-only
- Clickable map regions and chart elements need role="button" and onKeyDown handlers
- Focus ring must be visible on all interactive elements

### Color
- Red/blue defaults must meet WCAG AA contrast ratio against white backgrounds
- Always provide a colorblind-safe palette option — see references/accessibility.md
- Never rely on color as the only differentiator between candidates

### Screen Readers
- Chart data must have a text summary or data table alternative
- Trend direction must be communicated in text, not just visually

---

## Design Tokens

Every generated component accepts an optional `theme` prop.
If no theme is provided, skill defaults are used.
Users only need to pass the tokens they want to override.

```ts
type ElectionTheme = {
  democratic: string    // default #2563eb
  republican: string    // default #dc2626
  independent: string   // default #16a34a
  uncalled: string      // default #9ca3af
  background: string    // default #ffffff
  text: string          // default #111827
  tooltipBg: string     // default #1f2937
}

const defaultTheme: ElectionTheme = {
  democratic: '#2563eb',
  republican: '#dc2626',
  independent: '#16a34a',
  uncalled: '#9ca3af',
  background: '#ffffff',
  text: '#111827',
  tooltipBg: '#1f2937',
}
```

Apply theme in every component using Partial<ElectionTheme>:

```tsx
const ExampleChart = ({
  data,
  theme,
}: {
  data: ComparisonGroup[]
  theme?: Partial<ElectionTheme>
}) => {
  const resolved = { ...defaultTheme, ...theme }
  // use resolved.democratic, resolved.republican, etc.
}
```

If the user has a design system with CSS custom properties, they can
pass those values in at the component level without modifying skill defaults.
See references/typescript-patterns.md for full theme usage examples.
