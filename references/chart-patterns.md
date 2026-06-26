# Chart Patterns

Implementation patterns for Visx charts. These apply to any chart built
with @visx/responsive, @visx/shape, @visx/scale, and related packages.

---

## Responsive Sizing with ParentSize

`@visx/responsive`'s `ParentSize` renders with `height: 100%` inside a
wrapper with `overflow: hidden`. If the parent has no explicit height, it
measures 0 and the SVG is invisible. Always wrap `ParentSize` in a
fixed-height div.

**Fixed height (trend lines, area charts):**

```tsx
const CHART_HEIGHT = 310
const MARGIN = { top: 28, right: 88, bottom: 44, left: 44 }
const TOTAL_HEIGHT = CHART_HEIGHT + MARGIN.top + MARGIN.bottom

<div style={{ height: TOTAL_HEIGHT }}>
  <ParentSize>
    {({ width }) => width > 0 ? <InnerChart width={width} /> : null}
  </ParentSize>
</div>
```

**Data-driven height (exit poll bar, any chart where rows drive height):**

```tsx
const ROW_HEIGHT = 22
const ROW_GAP = 6

const totalHeight =
  data.length * (ROW_HEIGHT + ROW_GAP) - ROW_GAP + MARGIN.top + MARGIN.bottom

<div style={{ height: totalHeight }}>
  <ParentSize>
    {({ width }) => width > 0 ? <InnerChart data={data} width={width} /> : null}
  </ParentSize>
</div>
```

Guard against `width > 0` inside the render prop to avoid passing a
zero-width chart on the first layout pass.

---

## Crosshair: Linked vs. Independent Mode

A chart that accepts an external `hoveredDate` prop (for linked
cross-chart hover) must not depend on that prop as the sole crosshair
source. If the prop is null or removed, the chart loses its own crosshair.

**Wrong — breaks in independent mode:**

```tsx
const crosshairX = hoveredDate != null ? xScale(hoveredDate) : null
```

**Correct — works in both modes:**

```tsx
const activeDate = hoveredDate ?? (tooltipOpen && tooltipData ? tooltipData.date : null)
const crosshairX = activeDate != null ? xScale(activeDate) : null
```

The external prop wins when present (linked mode). When absent, the chart
falls back to its own internal tooltip state (independent mode). Apply the
same pattern anywhere `hoveredDate` drives derived state — crosshair
position, highlight dot position, tooltip snap target.

---

## CSS Keyframe Animations in SVG

Inject animations via `<defs><style>` inside the SVG. Scope keyframe
names with `useId()` so multiple instances on the same page don't
conflict.

```tsx
const uid = useId().replace(/:/g, '')  // colon-safe for CSS identifiers

<svg>
  <defs>
    <style>{`
      @keyframes lineReveal-${uid} {
        from { transform: scaleX(0); }
        to   { transform: scaleX(1); }
      }
      .animated-group-${uid} {
        transform-box: fill-box;
        transform-origin: 0% 50%;
        animation: lineReveal-${uid} 1.6s cubic-bezier(0.4, 0, 0.2, 1) both;
      }
    `}</style>
  </defs>
  <g className={`animated-group-${uid}`}>
    {/* paths, lines, circles */}
  </g>
</svg>
```

`transform-box: fill-box` makes `transform-origin` relative to the
element's own bounding box, not the SVG viewport. Without it, `0% 50%`
refers to the viewport's top-left corner and the animation appears to
start from the wrong position.

`transform-origin: 0% 50%` anchors the scale at the left edge of the
group for a left-to-right reveal. Use `100% 50%` for right-to-left.

---

## Center-Axis Butterfly Bar

For an exit poll layout where bars extend outward from a shared center
axis (Harris left, Trump right):

```tsx
const innerWidth = width - MARGIN.left - MARGIN.right
const centerX = innerWidth / 2

// Scale: 0 → maxPct maps to half the inner width
const xScale = scaleLinear({ domain: [0, maxPct], range: [0, centerX] })

const harrisW = xScale(harrisPct)
const trumpW  = xScale(trumpPct)
```

**Harris bar (extends left):**

```tsx
<rect
  x={centerX - harrisW}
  width={harrisW}
  style={{
    transformBox: 'fill-box',
    transformOrigin: '100% 50%',  // right edge = center axis
    animation: `barIn-${uid} 0.55s ease both`,
    animationDelay: `${i * 0.055}s`,
  }}
/>
```

**Trump bar (extends right):**

```tsx
<rect
  x={centerX}
  width={trumpW}
  style={{
    transformBox: 'fill-box',
    transformOrigin: '0% 50%',   // left edge = center axis
    animation: `barIn-${uid} 0.55s ease both`,
    animationDelay: `${i * 0.055}s`,
  }}
/>
```

Both bars animate outward from the center line. The `transformOrigin`
for each side must point toward the axis, not away from it.

**Center divider line:**

```tsx
<line
  x1={centerX} x2={centerX}
  y1={0} y2={innerHeight}
  stroke="#d9d0bd"
  strokeWidth={1.5}
/>
```

---

## Tooltip Positioning

`ParentSize` renders its internal wrapper with `overflow: hidden` for measurement
purposes. Any `position: absolute` child inside it — including `TooltipWithBounds`
from `@visx/tooltip` — is silently clipped to the container boundary and never
visible outside it. Additionally, `position: absolute` elements take up space in
the normal document flow even when visually positioned elsewhere, which can
displace surrounding layout.

**Never render a tooltip inside `ParentSize`.**

The correct pattern for all Visx interactive charts: capture `e.clientX /
e.clientY` (viewport coordinates) on mouse events, store in plain React state,
render a `position: fixed` div at the component's top level outside `ParentSize`.
This escapes all container overflow constraints, never affects document flow, and
eliminates the coordinate-space mismatch that comes from mixing `localPoint()`
SVG-local coordinates with a `position: absolute` ancestor.

```tsx
type TooltipState = {
  label: string
  value: number | string
  x: number   // e.clientX
  y: number   // e.clientY
} | null

// State lives in the parent component (outside ParentSize):
const [tooltip, setTooltip] = useState<TooltipState>(null)

// Callbacks passed into InnerChart:
const handleHover = (label: string, value: number, e: React.MouseEvent) => {
  setTooltip({ label, value, x: e.clientX, y: e.clientY })
}
const handleMove = (label: string, value: number, e: React.MouseEvent) => {
  setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : t)
}
const handleLeave = () => setTooltip(null)

// On interactive SVG elements inside InnerChart:
onMouseEnter={e => onHover(label, value, e)}
onMouseMove={e => onMove(label, value, e)}
onMouseLeave={onLeave}

// Rendered outside ParentSize, inside the component wrapper:
{tooltip && (
  <div
    style={{
      position: 'fixed',
      top: tooltip.y - 44,
      left: tooltip.x + 12,
      zIndex: 9999,
      pointerEvents: 'none',
      background: '#18140f',
      color: '#f5f0e8',
      padding: '6px 10px',
      borderRadius: 4,
      fontSize: 12,
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}
  >
    <div style={{ fontWeight: 700 }}>{tooltip.label}</div>
    <div style={{ color: '#b5a99a' }}>{tooltip.value}</div>
  </div>
)}
```

Offset `top: y - 44` places the tooltip above the cursor. Adjust the offset
based on tooltip height. Use `left: x + 12` to keep it from sitting directly
under the cursor.

---

## Re-trigger Animation on Data Change

To replay a CSS `transition` when data changes — for example, when a dataset
toggle fires and the bars should animate in with the new values — bump a
`renderKey` counter and split the reset/play into two separate hooks.

A single `requestAnimationFrame` inside one `useEffect` does **not** work.
RAF fires before paint, not after. React may batch both state updates (`false`
then `true`) in the same paint cycle, so the browser never renders the reset
state and the transition has nothing to animate from.

The correct two-hook pattern:

```tsx
import { useState, useEffect, useLayoutEffect } from 'react'

// renderKey is incremented by the parent on every toggle
function InnerChart({ data, renderKey }: { data: ..., renderKey: number }) {
  const [visible, setVisible] = useState(true)

  // useLayoutEffect fires synchronously after DOM mutation, before paint.
  // This guarantees the browser commits the reset state (scaleY(0)) to
  // screen before the RAF fires.
  useLayoutEffect(() => {
    if (renderKey === 0) return
    setVisible(false)
  }, [renderKey])

  // useEffect fires after paint. The RAF here triggers after the first
  // paint with visible=false, giving the CSS transition a real start
  // state to animate from.
  useEffect(() => {
    if (renderKey === 0) return
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [renderKey])

  // Apply to bars via inline style:
  // style={{
  //   transform: visible ? 'scaleY(1)' : 'scaleY(0)',
  //   opacity: visible ? 1 : 0,
  //   transition: visible
  //     ? `transform 0.5s cubic-bezier(0.4,0,0.2,1) ${delay}, opacity 0.4s ease ${delay}`
  //     : 'none',
  // }}
}
```

Start `useState(true)` (visible) so bars are shown immediately on first render.
`renderKey === 0` guards prevent the animation from firing on initial mount.

In the parent, bump `renderKey` whenever the dataset changes:

```tsx
const [active, setActive] = useState<'national' | 'battleground'>('national')
const [renderKey, setRenderKey] = useState(0)

const handleToggle = (next: typeof active) => {
  if (next === active) return
  setActive(next)
  setRenderKey(k => k + 1)
}
```

---

## Rolling Average for Noisy Time-Series Data

For polling data (or any noisy time series), render a smoothed trend line
alongside the raw data points rather than connecting raw dots directly.

```tsx
function rollingAvg(
  pts: ParsedPoint[],
  candidate: string,
  window = 6
): Array<{ date: Date; value: number }> {
  return pts.map((d, i) => {
    const half = Math.floor(window / 2)
    const slice = pts.slice(Math.max(0, i - half), Math.min(pts.length, i + half + 1))
    const vals = slice.map(p => p.candidates[candidate] ?? 0).filter(v => v > 0)
    return {
      date: d.date,
      value: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0,
    }
  })
}
```

Window = 6 is a good default for weekly polling averages. Adjust for
data density — a denser dataset needs a larger window to produce a
readable trend.

Render the raw readings as scatter dots at reduced opacity alongside the
smoothed line. This preserves the underlying data signal without hiding
the trend:

```tsx
{/* Raw dots */}
{data.map((d, i) => (
  <circle
    key={i}
    cx={xScale(d.date)}
    cy={yScale(d.candidates[candidate] ?? 0)}
    r={3}
    fillOpacity={0.45}
  />
))}

{/* Smoothed trend line */}
<LinePath
  data={smoothed}
  x={d => xScale(d.date)}
  y={d => yScale(d.value)}
  strokeWidth={2.5}
  curve={curveMonotoneX}
/>
```
