/**
 * Shared types and theme utilities
 * Import from this file in all components — do not redefine per component
 */

// --- Canonical data shapes ---

export type TimeSeriesPoint = {
  date: string
  candidates: Record<string, number>
  source?: string
  isStale?: boolean
}

export type ComparisonGroup = {
  label: string
  values: Record<string, number>
  total?: number
}

export type DistributionSlice = {
  label: string
  value: number
  color?: string
}

export type GeoFeature = {
  id: string
  candidate: string
  margin: number
  color: string
  tooltip: string
}

// --- Race types ---

export type RaceType = 'gubernatorial' | 'senate' | 'house'

export type CandidateResult = {
  id: string
  name: string
  party: 'democratic' | 'republican' | 'independent' | 'other'
  votes: number
  percentage: number
  incumbent: boolean
}

export type RaceResult = {
  raceId: string
  raceType: RaceType
  state: string
  district?: number
  candidates: CandidateResult[]
  called: boolean
  calledAt?: string
  source: string
}

// --- Design tokens ---

export type ElectionTheme = {
  democratic: string
  republican: string
  independent: string
  uncalled: string
  background: string
  text: string
  tooltipBg: string
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

export const colorblindTheme: Partial<ElectionTheme> = {
  democratic: '#0072B2',
  republican: '#D55E00',
  independent: '#009E73',
  uncalled: '#999999',
}

export const resolveTheme = (theme?: Partial<ElectionTheme>): ElectionTheme => ({
  ...defaultTheme,
  ...theme,
})

// --- Base props ---

export type BaseChartProps = {
  theme?: Partial<ElectionTheme>
  width?: number
  height?: number
  className?: string
  'aria-label'?: string
}

// --- Multi-source state ---

export type SourceState<T> = {
  id: string
  data: T
  isLoading: boolean
  isError: boolean
  error?: Error
  updatedAt: number
  isStale: boolean
}
