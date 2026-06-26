# Map Implementation

Two rendering patterns are used. Never mix them in the same component.
See SKILL.md for the decision guide on which to use.

---

## Pattern A — D3 Owns the DOM

Use for: district maps, zoom to bounding box, cartograms, raster tiles.
D3 runs inside useEffect against a ref. React is a container only.

```tsx
import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const DistrictMap = ({ data, theme }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data) return

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // clear on re-render

    const projection = d3.geoAlbersUsa()
      .scale(width)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    // Draw features
    svg.selectAll('path')
      .data(data.features)
      .join('path')
      .attr('d', path)
      .attr('fill', d => getColor(d, theme))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.5)

  }, [data, theme])

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-labelledby="map-title"
      style={{ width: '100%', height: '100%' }}
    >
      <title id="map-title">Election results map</title>
    </svg>
  )
}
```

### Verify dataset contents, don't assume them

Any claim about what is or isn't present in a topology/geo dataset
(e.g. "DC isn't in the states topology," "this file has no territories")
must be verified against the actual file before being coded as a
comment or conditional — not asserted from general knowledge or a
half-remembered fact about the dataset. A false assumption like this is
easy to act on confidently and hard to notice is wrong, because the
workaround built on top of it (a manual marker, a special-cased branch)
will run without erroring — it just produces a wrong result silently.
Fetch the file and check (`topology.objects.<name>.geometries.find(g => g.id === ...)`)
before writing code that depends on a feature being present or absent.

### Stale closures in event handlers

If event handlers (`.on('click', ...)`, `.on('mousemove', ...)`) are
attached inside a `useEffect` whose dependency array is intentionally
narrow — e.g. `[geographies]` only, to avoid re-binding listeners on
every data/frame change — those handlers close over whatever
props/state existed when the effect last ran, and silently stop seeing
later updates. This is easy to hit and easy to miss: the map still
re-renders with new fill colors (a separate effect handles that), but
the tooltip or click handler keeps reporting data from the first render.

Fix: read current values through a `ref` that's updated on every
relevant change, not through the closure.

```tsx
const yearDataRef = useRef(yearData)

useEffect(() => {
  yearDataRef.current = yearData // keep ref current on every change
  // ... re-color paths, update aria-labels, etc.
}, [yearData])

useEffect(() => {
  // handlers attached once — read yearDataRef.current, never yearData directly
  svg.selectAll('path').on('mousemove', (event, d) => {
    const result = yearDataRef.current[d.id]
    // ...
  })
}, [geographies])
```

### React + D3 overlays

Don't render React JSX children inside the same `<svg>` that D3 calls
`.selectAll().join()` against — React's declarative reconciliation and
D3's direct DOM writes will fight over the same children. If you need
to layer a React-rendered element on top (a focus ring, a highlight, an
annotation), render it in a separate sibling `<svg>` with the same
`viewBox` and `pointer-events: none`, stacked on top with CSS:

```tsx
<div style={{ position: 'relative' }}>
  <svg ref={svgRef} viewBox={viewBox} /> {/* D3-owned */}
  {focusedShape && (
    <svg viewBox={viewBox} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <path d={focusedShape} fill="none" stroke="#18140f" strokeWidth={2} />
    </svg>
  )}
</div>
```

---

## Pattern B — React Owns the DOM

Use for: national choropleth, graduated symbols, react-simple-maps.
D3 handles math only. React renders all SVG elements.

```tsx
import { useMemo } from 'react'
import * as d3 from 'd3'
import { GeoFeature } from '../types'

const StateMap = ({ data, theme, width = 800, height = 500 }) => {
  const projection = useMemo(() =>
    d3.geoAlbersUsa().scale(width).translate([width / 2, height / 2])
  , [width, height])

  const pathGenerator = d3.geoPath().projection(projection)

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-labelledby="map-title"
    >
      <title id="map-title">Election results by state</title>
      {data.features.map(feature => (
        <path
          key={feature.id}
          d={pathGenerator(feature) ?? ''}
          fill={getColor(feature, theme)}
          stroke="#ffffff"
          strokeWidth={0.5}
          role="button"
          tabIndex={0}
          aria-label={feature.properties?.tooltip}
          onKeyDown={e => e.key === 'Enter' && onStateClick?.(feature)}
        />
      ))}
    </svg>
  )
}
```

### Small multiples

When rendering multiple maps in a grid (one per year, decade, or race),
compute a single `pathGenerator` from the full geography set and share it
across all panels. Each panel running its own `fitSize` call risks subtle
scale differences if data ever varies between panels.

```tsx
const pathGenerator = useMemo(() => {
  if (geographies.length === 0) return null
  const projection = geoAlbersUsa().fitSize([panelWidth, panelHeight], {
    type: 'FeatureCollection',
    features: geographies,
  } as never)
  return geoPath(projection)
}, [geographies, panelWidth, panelHeight])
```

Use `<figure>`/`<figcaption>` for each panel — the correct semantic
element for a self-contained unit of content with a caption:

```tsx
<figure style={{ margin: 0 }}>
  <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-labelledby={titleId}>
    <title id={titleId}>US election results, {decadeLabel}</title>
    {/* paths */}
  </svg>
  <figcaption style={{ textAlign: 'center' }}>{decadeLabel}</figcaption>
</figure>
```

Use `repeat(auto-fit, minmax(260px, 1fr))` for the grid rather than
fixed breakpoint classes. Auto-fit handles any panel count and any
container width without knowing the breakpoint in advance:

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 24,
}}>
  {panels.map(p => <SmallMultiplePanel key={p.id} {...p} />)}
</div>
```

---

## react-simple-maps (Pattern B shortcut)

react-simple-maps implements Pattern B internally.
Use it for national and state choropleth to avoid boilerplate.

```tsx
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const NationalChoropleth = ({ data, theme, onStateClick }) => {
  const colorScale = (stateId: string) => {
    const feature = data.find(d => d.id === stateId)
    if (!feature) return theme.uncalled
    return feature.candidate === 'democratic'
      ? theme.democratic
      : theme.republican
  }

  return (
    <ComposableMap projection="geoAlbersUsa">
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={colorScale(geo.id)}
              stroke="#ffffff"
              strokeWidth={0.5}
              onClick={() => onStateClick?.(geo.id)}
              style={{
                hover: { opacity: 0.8, cursor: 'pointer' },
                pressed: { opacity: 0.6 },
              }}
            />
          ))
        }
      </Geographies>
    </ComposableMap>
  )
}
```

---

## Zoom to Bounding Box (Pattern A)

Click a state to zoom in. Used for House district drill-down.
Based on the D3 zoom-to-bounding-box Observable pattern.

```tsx
useEffect(() => {
  if (!svgRef.current) return
  const svg = d3.select(svgRef.current)
  const g = svg.append('g')

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  const zoomToState = (feature: d3.GeoPermissibleObjects) => {
    const [[x0, y0], [x1, y1]] = path.bounds(feature)
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(8, 0.9 / Math.max(
          (x1 - x0) / width,
          (y1 - y0) / height
        )))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    )
  }

  // Attach click handler to state paths
  g.selectAll('.state')
    .on('click', (event, d) => zoomToState(d as d3.GeoPermissibleObjects))

}, [data])
```

---

## TopoJSON Sources

| Geography | URL |
|---|---|
| US States | `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json` |
| US Counties | `https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json` |
| Congressional Districts | Census Bureau TIGER shapefiles — convert with mapshaper |

`d3.geoAlbersUsa()` automatically insets Alaska and Hawaii at reduced
scale in the standard bottom-left position — this satisfies "all 50
states visible" for free. No manual repositioning logic needed; that's
only necessary if you're using a projection other than `geoAlbersUsa`.

### Converting Census Shapefiles to TopoJSON

```bash
# Install mapshaper
npm install -g mapshaper

# Convert shapefile to GeoJSON then TopoJSON
mapshaper cb_2023_us_cd118_500k.shp -simplify 10% -o format=topojson districts.json
```

---

## Margin-Based Color Scales

When coloring states by win margin rather than just winner-take-all,
the choice of scale matters more than it looks like it should.

### Continuous diverging scales collapse toward the midpoint

A continuous 3-stop diverging scale (e.g. red → purple → blue,
interpolated by margin) looks reasonable in isolation but reads as
"everything is purple" once real data is applied — most real-world
election margins cluster closer to the midpoint than to the extremes,
so a linear interpolation puts most states in the muddy middle of the
scale where hue discrimination is weakest.

Two alternatives that hold up better:

**Discrete threshold bands** — hard cutoffs instead of a gradient:

```ts
import { scaleThreshold } from 'd3-scale'

const colorScale = scaleThreshold<number, string>()
  .domain([-15, -5, 5, 15])             // 4 breakpoints → 5 bands
  .range(['#9c1c1c', '#cf8f80', '#9c8bc4', '#86a9d6', '#1f4e8c'])
  // strong R, lean R, toss-up, lean D, strong D
```

**Bivariate hue + intensity** — hue encodes the winner, a white-to-color
ramp encodes how decisive the margin was, so a 1-point win and a
40-point landslide are both "red" but look nothing alike:

```ts
import { interpolateRgb } from 'd3-interpolate'

const MAX_MARGIN = 40
const redScale = interpolateRgb('#f7f2e6', '#b3242d')
const blueScale = interpolateRgb('#f7f2e6', '#1f5fa8')

function marginColor(margin: number): string {
  const t = Math.sqrt(Math.min(Math.abs(margin) / MAX_MARGIN, 1))
  // sqrt curve front-loads differentiation in the common 0-25pt range,
  // not just at landslide extremes
  return margin >= 0 ? blueScale(t) : redScale(t)
}
```

### Generate legends from the real color function

Don't hand-pick separate legend swatch colors that are meant to match
the scale — sample the actual `marginColor`/`colorScale` function at
several points and build the legend (swatches or a gradient) from
those samples. Otherwise the legend silently drifts out of sync the
next time the scale changes.

```ts
function marginGradientCss(steps = 40): string {
  const stops: string[] = []
  for (let i = 0; i <= steps; i++) {
    const margin = -MAX_MARGIN + (i / steps) * (2 * MAX_MARGIN)
    stops.push(`${marginColor(margin)} ${(i / steps) * 100}%`)
  }
  return `linear-gradient(to right, ${stops.join(', ')})`
}
```

---

## Observable Code Translation Note

Observable notebooks use vanilla D3, not React.
When adapting Observable map code, always:
1. Move D3 logic inside useEffect
2. Target a ref instead of document.body or a notebook cell
3. Add `svg.selectAll('*').remove()` at the top of useEffect to prevent duplicate renders
4. Return a cleanup function if zoom or event listeners are attached
