# TypeScript Patterns

Canonical types for all chart categories and the design token system.
Import from a shared types file — do not redefine per component.

---

## Canonical Data Shapes

```ts
// Time series — line charts, area charts, real-time polling
export type TimeSeriesPoint = {
  date: string                          // ISO 8601: "2024-11-05"
  candidates: Record<string, number>    // { harris: 48.2, trump: 45.1 }
  source?: string                       // originating provider id
  isStale?: boolean
}

// Comparison — bar charts, grouped bars, exit polls
export type ComparisonGroup = {
  label: string                         // "Women 18-29" or candidate name
  values: Record<string, number>        // { harris: 62, trump: 31, other: 7 }
  total?: number
}

// Distribution — pie, donut, seat counts
export type DistributionSlice = {
  label: string                         // "Democratic", "Republican", "Uncalled"
  value: number                         // seat count or electoral votes
  color?: string                        // override theme default
}

// Geographic — choropleth maps, district maps
export type GeoFeature = {
  id: string                            // FIPS code or state abbreviation
  candidate: string                     // leading or winning candidate key
  margin: number                        // win margin as percentage
  color: string                         // resolved hex color
  tooltip: string                       // pre-formatted hover text
}
```

---

## Design Token System

```ts
export type ElectionTheme = {
  democratic: string    // default #2563eb
  republican: string    // default #dc2626
  independent: string   // default #16a34a
  uncalled: string      // default #9ca3af
  background: string    // default #ffffff
  text: string          // default #111827
  tooltipBg: string     // default #1f2937
}

export const defaultTheme: ElectionTheme = {
  democratic: '#2563eb',
  republican: '#dc2626',
  independent: '#16a34a',
  uncalled: '#9ca3af',
  background: '#ffffff',
  text: '#111827',
  tooltipBg: '#1f2937',
}

// Resolve partial theme — always spread defaultTheme first
export const resolveTheme = (theme?: Partial<ElectionTheme>): ElectionTheme => ({
  ...defaultTheme,
  ...theme,
})
```

### Map-specific theme extensions

The base `ElectionTheme` covers chart and party colors. Choropleth and
small-multiples maps need additional tokens for no-data states, ties,
and highlight/dim interactions. Extend rather than replace:

```ts
export type MapTheme = ElectionTheme & {
  noData: string          // fill for states with missing data
  tie: string             // fill for tied states (equal D/R wins)
  highlightStroke: string // stroke color on the selected state
  dimmedOpacity: number   // opacity of non-selected states (0–1)
}

export const defaultMapTheme: MapTheme = {
  ...defaultTheme,
  noData: '#9ca3af',
  tie: '#7b5ea7',
  highlightStroke: '#18140f',
  dimmedOpacity: 0.25,
}
```

Map components accept `theme?: Partial<MapTheme>` so consumers can
override individual tokens without replacing the whole object:

```tsx
<DecadeChoroplethGrid dataset={dataset} theme={{ republican: '#8b0000' }} />
```

### Using theme in a component

```tsx
type ChartProps = {
  data: ComparisonGroup[]
  theme?: Partial<ElectionTheme>
  onSelect?: (label: string) => void
}

const CandidateBarChart = ({ data, theme, onSelect }: ChartProps) => {
  const resolved = resolveTheme(theme)

  const getColor = (candidateKey: string) => {
    if (candidateKey.includes('democratic')) return resolved.democratic
    if (candidateKey.includes('republican')) return resolved.republican
    if (candidateKey.includes('independent')) return resolved.independent
    return resolved.uncalled
  }

  // use resolved.background, resolved.text, etc.
}
```

### CSS custom properties (design system integration)

If the user has a design system using CSS custom properties,
they can pass those in at the component level:

```tsx
<CandidateBarChart
  data={data}
  theme={{
    democratic: 'var(--color-party-dem)',
    republican: 'var(--color-party-rep)',
  }}
/>
```

---

## Race Types

```ts
export type RaceType = 'gubernatorial' | 'senate' | 'house'

export type RaceResult = {
  raceId: string
  raceType: RaceType
  state: string
  district?: number           // house only
  candidates: CandidateResult[]
  called: boolean
  calledAt?: string           // ISO 8601
  source: string
}

export type CandidateResult = {
  id: string
  name: string
  party: 'democratic' | 'republican' | 'independent' | 'other'
  votes: number
  percentage: number
  incumbent: boolean
}
```

---

## Multi-Source State

```ts
export type SourceState<T> = {
  id: string
  data: T
  isLoading: boolean
  isError: boolean
  error?: Error
  updatedAt: number           // Date.now() timestamp
  isStale: boolean            // true if updatedAt > staleThreshold
}

export type MultiSourceState<T> = {
  sources: SourceState<T>[]
  merged: T                   // all sources combined
  anyLoading: boolean
  anyError: boolean
  lastUpdated: number         // most recent updatedAt across all sources
}
```

---

## Component Base Props

All generated components extend this base:

```ts
export type BaseChartProps = {
  theme?: Partial<ElectionTheme>
  width?: number
  height?: number
  className?: string
  'aria-label'?: string
}
```
