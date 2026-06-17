/**
 * NationalChoropleth
 *
 * National US map colored by leading candidate per state.
 * Uses react-simple-maps (Pattern B — React owns the DOM).
 * For district-level detail, use D3 + TopoJSON (Pattern A).
 *
 * Test case: "Color each state by the leading candidate with a hover tooltip."
 *
 * Model: Sonnet 4.6
 */

import { useState, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps'
import { GeoFeature, ElectionTheme, resolveTheme } from '../types'

// --- TopoJSON source ---
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// --- Types ---

type NationalChoroplethProps = {
  data: GeoFeature[]
  title?: string
  theme?: Partial<ElectionTheme>
  onStateClick?: (stateId: string) => void
  className?: string
}

type TooltipState = {
  content: string
  x: number
  y: number
} | null

// --- Mock data for testing ---
// Shape: GeoFeature[]
// FIPS codes: https://www.census.gov/library/reference/code-lists/ansi/ansi-codes-for-states.html

export const mockData: GeoFeature[] = [
  { id: '06', candidate: 'democratic', margin: 29.2, color: '', tooltip: 'California — Democratic +29.2%' },
  { id: '48', candidate: 'republican', margin: 5.8,  color: '', tooltip: 'Texas — Republican +5.8%' },
  { id: '12', candidate: 'republican', margin: 3.4,  color: '', tooltip: 'Florida — Republican +3.4%' },
  { id: '36', candidate: 'democratic', margin: 22.9, color: '', tooltip: 'New York — Democratic +22.9%' },
  { id: '17', candidate: 'democratic', margin: 17.1, color: '', tooltip: 'Illinois — Democratic +17.1%' },
  // Add all 50 states for real usage
]

// --- Adapter ---
// Raw API → GeoFeature[]

export const stateResultsAdapter = (
  raw: {
    fips: string
    winner: string
    margin: number
    stateName: string
  }[]
): GeoFeature[] =>
  raw.map(item => ({
    id: item.fips,
    candidate: item.winner.toLowerCase(),
    margin: item.margin,
    color: '',  // resolved in component from theme
    tooltip: `${item.stateName} — ${item.winner} +${item.margin.toFixed(1)}%`,
  }))

// --- Component ---

export const NationalChoropleth = ({
  data,
  title = 'Election Results by State',
  theme,
  onStateClick,
  className,
}: NationalChoroplethProps) => {
  const resolved = resolveTheme(theme)
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  const getColor = useCallback((stateId: string): string => {
    const feature = data.find(d => d.id === stateId)
    if (!feature) return resolved.uncalled
    if (feature.candidate === 'democratic') return resolved.democratic
    if (feature.candidate === 'republican') return resolved.republican
    if (feature.candidate === 'independent') return resolved.independent
    return resolved.uncalled
  }, [data, resolved])

  const getTooltip = useCallback((stateId: string): string => {
    return data.find(d => d.id === stateId)?.tooltip ?? 'No data'
  }, [data])

  if (!data.length) {
    return (
      <div role="status" aria-label="No map data available">
        No state data available.
      </div>
    )
  }

  return (
    <figure
      className={className}
      style={{ width: '100%', position: 'relative', background: resolved.background }}
    >
      <figcaption
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 8,
          color: resolved.text,
        }}
      >
        {title}
      </figcaption>

      {/* Tooltip */}
      {tooltip && (
        <div
          role="tooltip"
          aria-live="polite"
          style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: tooltip.y - 28,
            background: resolved.tooltipBg,
            color: '#ffffff',
            padding: '6px 10px',
            borderRadius: 4,
            fontSize: 13,
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Screen reader data table */}
      <table style={{ position: 'absolute', left: '-9999px' }}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>State</th>
            <th>Leading Candidate</th>
            <th>Margin</th>
          </tr>
        </thead>
        <tbody>
          {data.map(feature => (
            <tr key={feature.id}>
              <td>{feature.id}</td>
              <td>{feature.candidate}</td>
              <td>{feature.margin.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ComposableMap
        projection="geoAlbersUsa"
        role="img"
        aria-labelledby="map-title"
        style={{ width: '100%', height: 'auto' }}
      >
        <title id="map-title">{title}</title>
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getColor(geo.id)}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  tabIndex={0}
                  role="button"
                  aria-label={getTooltip(geo.id)}
                  onClick={() => onStateClick?.(geo.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onStateClick?.(geo.id)
                    }
                  }}
                  onMouseEnter={e => {
                    setTooltip({
                      content: getTooltip(geo.id),
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    hover: { opacity: 0.8, cursor: 'pointer', outline: 'none' },
                    pressed: { opacity: 0.6 },
                    default: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 8,
          fontSize: 13,
          color: resolved.text,
        }}
        aria-label="Map legend"
      >
        {[
          { label: 'Democratic', color: resolved.democratic },
          { label: 'Republican', color: resolved.republican },
          { label: 'No data', color: resolved.uncalled },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: 2,
                background: item.color,
              }}
              aria-hidden="true"
            />
            {item.label}
          </div>
        ))}
      </div>
    </figure>
  )
}

export default NationalChoropleth

// --- Dependencies ---
// npm install react-simple-maps
