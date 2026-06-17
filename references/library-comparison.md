# Library Comparison

Use this reference when deciding which library to reach for.
Default to Visx for anything production or analyst-facing.

---

## Chart Libraries

### Visx
- **Made by:** Airbnb, used by NYT graphics team
- **Renders:** SVG
- **React model:** React owns the DOM, D3 handles math
- **Strengths:** Full control over every visual element, composable primitives,
  works with any animation library, no opinions on styling
- **Weaknesses:** More boilerplate than Recharts, no built-in chart types —
  you assemble from primitives
- **Use for:** Polling trend lines, exit poll grouped bars, vote share area charts,
  any chart that needs to look production-quality
- **Install:** `npm install @visx/shape @visx/scale @visx/axis @visx/group @visx/tooltip`

### Recharts
- **Renders:** SVG
- **React model:** Declarative component API, D3 under the hood
- **Strengths:** Fastest to build, readable JSX, good defaults
- **Weaknesses:** Less control than Visx, harder to customize deeply
- **Use for:** Simple candidate bar charts, donut/pie, internal tooling,
  prototyping before moving to Visx
- **Install:** `npm install recharts`

### Lightweight Charts
- **Made by:** TradingView
- **Renders:** Canvas
- **Strengths:** Built specifically for real-time time-series data,
  handles high-frequency updates without performance degradation
- **Weaknesses:** Canvas-based so no CSS styling of individual elements,
  limited chart types (line, area, candlestick, bar)
- **Use for:** Live election night feeds, real-time polling updates,
  any component polling an API on an interval
- **Install:** `npm install lightweight-charts`

### D3
- **Renders:** SVG (or Canvas)
- **React model:** Pattern A only — D3 owns the DOM via useEffect
- **Strengths:** Maximum control, handles any visualization imaginable,
  the standard for newsroom graphics teams
- **Weaknesses:** Steep learning curve, verbose, fights React's rendering model
  when used naively
- **Use for:** District-level maps, zoom to bounding box, cartograms,
  anything react-simple-maps cannot handle
- **Install:** `npm install d3 topojson-client`
- **Note:** Never copy D3 code into JSX return statements.
  Always run D3 inside useEffect against a ref.

### Chart.js
- **Not recommended for this skill**
- Canvas-based — no CSS composability, no SVG control
- Recharts covers the same use cases in SVG with a better React API

---

## Map Libraries

### react-simple-maps
- **Built on:** D3-geo + TopoJSON
- **React model:** Pattern B — React renders SVG, D3 handles projection math
- **Strengths:** Easiest React map implementation, handles national and state
  choropleth cleanly, good TypeScript support
- **Weaknesses:** Not suitable for district-level detail, limited zoom behavior
- **Use for:** National choropleth (gubernatorial, senate),
  state-level coloring by winner or margin
- **Install:** `npm install react-simple-maps`
- **TopoJSON source:** `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`

### D3 + TopoJSON
- **React model:** Pattern A — D3 owns the DOM
- **Strengths:** Handles any geographic complexity, zoom transitions,
  bounding box drill-down, district-level detail, Observable notebook
  patterns translate directly
- **Weaknesses:** Significantly more complex, requires Pattern A discipline
- **Use for:** House district maps, click-to-zoom state drill-down, cartograms
- **TopoJSON sources:**
  - States: `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`
  - Counties: `https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json`
  - Congressional districts: Census Bureau TIGER shapefiles (convert with mapshaper)

### Mapbox / MapTiler SDK
- **React model:** Library manages its own canvas, wrap in useEffect
- **Strengths:** Real basemap tiles (streets, terrain, satellite),
  smooth vector tile zoom, handles millions of features
- **Weaknesses:** Requires API key, adds significant bundle size,
  overkill for most election map use cases
- **Use for:** When geographic context matters — showing a district
  in relation to actual streets, terrain, or city boundaries
- **Install:** `npm install mapbox-gl` or `npm install @maptiler/sdk`

---

## Decision Summary

| Need | Library |
|---|---|
| Fast standard chart | Recharts |
| Production quality chart | Visx |
| Real-time live feed | Lightweight Charts |
| National/state map | react-simple-maps |
| District map or drill-down | D3 + TopoJSON |
| Street/terrain context | Mapbox or MapTiler |
| Cartogram | D3 + TopoJSON |
