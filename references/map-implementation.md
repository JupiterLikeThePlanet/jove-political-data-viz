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

### Converting Census Shapefiles to TopoJSON

```bash
# Install mapshaper
npm install -g mapshaper

# Convert shapefile to GeoJSON then TopoJSON
mapshaper cb_2023_us_cd118_500k.shp -simplify 10% -o format=topojson districts.json
```

---

## Observable Code Translation Note

Observable notebooks use vanilla D3, not React.
When adapting Observable map code, always:
1. Move D3 logic inside useEffect
2. Target a ref instead of document.body or a notebook cell
3. Add `svg.selectAll('*').remove()` at the top of useEffect to prevent duplicate renders
4. Return a cleanup function if zoom or event listeners are attached
