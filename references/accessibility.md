# Accessibility

All generated components must meet WCAG AA as a baseline.
Apply these patterns in every component without being asked.

---

## SVG Accessibility

Every SVG needs a title and role:

```tsx
<svg role="img" aria-labelledby="chart-title-id">
  <title id="chart-title-id">
    Polling trend for Harris, Trump, and Stein — October 2024
  </title>
  {/* chart content */}
</svg>
```

For charts with meaningful axes, add a description too:

```tsx
<svg role="img" aria-labelledby="chart-title" aria-describedby="chart-desc">
  <title id="chart-title">Candidate polling trend</title>
  <desc id="chart-desc">
    Line chart showing polling percentages for three candidates
    over 90 days. Harris leads at 48%, Trump at 45%, Stein at 3%.
  </desc>
</svg>
```

---

## Interactive Elements

Clickable paths, bars, and map regions must be keyboard accessible:

```tsx
<path
  role="button"
  tabIndex={0}
  aria-label={`${state.name}: ${state.candidate} leading at ${state.margin}%`}
  onClick={() => onSelect(state.id)}
  onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(state.id)
    }
  }}
/>
```

### Pattern A (D3-owned DOM)

The example above is React-rendered (Pattern B). When D3 owns the DOM
directly (see map-implementation.md Pattern A), `<path>` elements still
need `tabindex` and a `keydown` handler attached explicitly — a `<path>`
never receives a synthetic click from Enter/Space the way `<button>` or
`<a>` do, so a component can look keyboard-accessible (it has
`tabindex`) while the keyboard is actually inert:

```ts
svg.selectAll('path')
  .attr('tabindex', 0)
  .attr('aria-label', d => `${d.name}: ${d.candidate} leading at ${d.margin}%`)
  .on('click', (event, d) => onSelect(d.id))
  .on('keydown', (event: KeyboardEvent, d) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(d.id)
  })
```

### Toggle states and rich labels

Use `aria-pressed` when a path acts as a toggle (selected/deselected):

```tsx
<path
  role="button"
  tabIndex={0}
  aria-pressed={isSelected}
  aria-label={describeFeature(feature, decadeLabel)}
  onClick={() => onSelect(feature.id)}
  onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(feature.id) }
  }}
>
  <title>{describeFeature(feature, decadeLabel)}</title>
</path>
```

The `<title>` child duplicates `aria-label` intentionally — some screen
readers do not process `aria-label` on SVG `<path>` elements and fall
back to `<title>` instead.

Compute label strings with a dedicated helper rather than inline template
literals. Inline strings get long and go stale silently when the data
shape changes:

```ts
function describeFeature(f: DecadeGeoFeature, decadeLabel: string): string {
  if (f.dominantParty === 'no-data') {
    return `${f.state}: no presidential election data in the ${decadeLabel}.`
  }
  if (f.dominantParty === 'tie') {
    return `${f.state}: split evenly in the ${decadeLabel} — ${f.demWins}D, ${f.repWins}R (${f.electionYears.join(', ')}).`
  }
  const party = f.dominantParty === 'D' ? 'Democratic' : 'Republican'
  const wins = f.dominantParty === 'D' ? f.demWins : f.repWins
  return `${f.state}: ${party} won ${wins} of ${f.totalElections} elections in the ${decadeLabel} (${f.electionYears.join(', ')}).`
}
```

### Selection state announcements

When a click selects or highlights something across multiple panels,
announce the change with a dedicated `aria-live` region:

```tsx
<div aria-live="polite" style={{ minHeight: 20 }}>
  {selectedState
    ? `Tracing ${selectedState} across all panels. Click it again or press Escape to clear.`
    : 'Click any state to trace its partisan lean across all decades.'}
</div>
```

The idle text tells screen reader users what's interactive before they've
found it. The selected text confirms the action and explains how to undo it.

### Escape key for dismissing selections

Any click-to-select interaction must also support Escape. Register a
document-level listener alongside any click-outside handler, and clean
it up when the selection clears — otherwise a global listener stays
attached permanently:

```tsx
useEffect(() => {
  if (!selectedState) return
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedState(null) }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}, [selectedState])
```

Tooltips must not be hover-only. Keyboard focus should trigger the same
information that hover triggers. Use aria-live for dynamically revealed content:

```tsx
<div role="tooltip" aria-live="polite">
  {hoveredState && (
    <p>{hoveredState.name}: {hoveredState.candidate} +{hoveredState.margin}%</p>
  )}
</div>
```

---

## Color

### Default palette — WCAG AA on white

| Token | Hex | Contrast on white |
|---|---|---|
| democratic | #2563eb | 4.7:1 ✅ |
| republican | #dc2626 | 4.5:1 ✅ |
| independent | #16a34a | 4.6:1 ✅ |
| uncalled | #9ca3af | 2.5:1 ⚠️ use on dark bg only |

### Colorblind-safe palette

Use when the user requests colorblind accessibility or when color
is the primary differentiator between candidates.

| Role | Hex | Name |
|---|---|---|
| Democratic | #0072B2 | Blue (safe for deuteranopia and protanopia) |
| Republican | #D55E00 | Vermillion |
| Independent | #009E73 | Bluish green |
| Uncalled | #999999 | Gray |

This is the Wong colorblind palette — widely used in scientific publishing.

```ts
export const colorblindTheme: Partial<ElectionTheme> = {
  democratic: '#0072B2',
  republican: '#D55E00',
  independent: '#009E73',
  uncalled: '#999999',
}
```

Pass as theme prop:
```tsx
<NationalChoropleth data={data} theme={colorblindTheme} />
```

### Never use color alone

Always pair color with at least one of:
- A text label on or near the element
- A pattern fill (for print or high-contrast contexts)
- An icon or shape indicator

---

## Data Table Alternative

Every chart should have a visually hidden data table as a fallback
for screen readers. Use a sr-only class or equivalent:

```tsx
const DataTableFallback = ({ data }: { data: ComparisonGroup[] }) => (
  <table className="sr-only">
    <caption>Election polling data</caption>
    <thead>
      <tr>
        <th>Group</th>
        {Object.keys(data[0]?.values ?? {}).map(k => (
          <th key={k}>{k}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map(row => (
        <tr key={row.label}>
          <td>{row.label}</td>
          {Object.values(row.values).map((v, i) => (
            <td key={i}>{v}%</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)
```

---

## Trend Direction in Text

Do not communicate trend direction through visual slope alone.
Add a text indicator:

```tsx
const TrendIndicator = ({ current, previous }: { current: number, previous: number }) => {
  const diff = current - previous
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'unchanged'
  const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'

  return (
    <span aria-label={`Trending ${direction} by ${Math.abs(diff).toFixed(1)} points`}>
      {arrow} {Math.abs(diff).toFixed(1)}
    </span>
  )
}
```

---

## Focus Styles

Never remove focus rings. Add visible focus styles to all interactive chart elements:

```css
.chart-interactive:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

In Tailwind:
```tsx
className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
```

### Choropleths and other variable-fill-color maps

The examples above assume a fixed background. A choropleth's fill color
is data-driven and varies per state across the full color scale — a
single outline color verified against one swatch is not verified
against the map. Check contrast against your scale's full range, not
just one example fill: a ring that hits 16:1 against a pale toss-up
color can drop to ~3:1 or below against a deep saturated landslide
color.

Preferred fix: a single solid dark ring (e.g. `#18140f` or your theme's
ink/text color), verified against the darkest fill in your scale. This
keeps the map visually clean and is sufficient for most light-background
map styles.

```css
.state-path:focus-visible {
  outline: 2px solid #18140f;
  outline-offset: 1px;
}
```

Fallback for dark map backgrounds or styles that require it: a two-tone
ring (light outer + dark inner), since no single solid color can pass
3:1 contrast against both very light and very dark fills at once. Draw
it as two stroked paths rather than a CSS outline:

```tsx
<path d={focusedShape} fill="none" stroke="#ffffff" strokeWidth={4} />
<path d={focusedShape} fill="none" stroke="#18140f" strokeWidth={1.5} />
```

If using D3 to own the DOM (Pattern A), render this overlay in a
separate sibling `<svg>` rather than as a child of the D3-managed one —
see map-implementation.md, "React + D3 overlays."
