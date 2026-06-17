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
