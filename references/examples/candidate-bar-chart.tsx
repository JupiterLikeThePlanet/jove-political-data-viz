/**
 * CandidateBarChart
 *
 * Candidate comparison bar chart using Recharts.
 * For production/newsroom quality, swap Recharts for Visx.
 *
 * Test case: "I have polling data for 4 candidates in Arizona. Build a bar chart."
 *
 * Model: Haiku 4.5 (Recharts) / Sonnet 4.6 (Visx upgrade)
 */

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ComparisonGroup, ElectionTheme, defaultTheme, resolveTheme } from '../types'

// --- Types ---

type CandidateBarChartProps = {
  data: ComparisonGroup[]
  title?: string
  theme?: Partial<ElectionTheme>
  className?: string
  'aria-label'?: string
}

// --- Mock data for testing ---
// Shape: ComparisonGroup[]
// Test with: <CandidateBarChart data={mockData} />

export const mockData: ComparisonGroup[] = [
  { label: 'Harris',  values: { support: 48.2 } },
  { label: 'Trump',   values: { support: 45.1 } },
  { label: 'Stein',   values: { support: 3.4 } },
  { label: 'Kennedy', values: { support: 2.1 } },
]

// --- Adapter ---
// Raw API → ComparisonGroup[]
// Adapt this to match your actual API shape

export const genericAdapter = (
  raw: { name: string; percentage: number }[]
): ComparisonGroup[] =>
  raw.map(item => ({
    label: item.name,
    values: { support: item.percentage },
  }))

// --- Color resolver ---

const getCandidateColor = (label: string, theme: ElectionTheme): string => {
  const lower = label.toLowerCase()
  if (lower.includes('harris') || lower.includes('democratic')) return theme.democratic
  if (lower.includes('trump') || lower.includes('republican')) return theme.republican
  if (lower.includes('stein') || lower.includes('independent')) return theme.independent
  return theme.uncalled
}

// --- Custom tooltip ---

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div
      role="tooltip"
      style={{
        background: '#1f2937',
        color: '#ffffff',
        padding: '8px 12px',
        borderRadius: 4,
        fontSize: 14,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0 }}>{payload[0].value.toFixed(1)}%</p>
    </div>
  )
}

// --- Component ---

export const CandidateBarChart = ({
  data,
  title = 'Candidate Polling',
  theme,
  className,
  'aria-label': ariaLabel,
}: CandidateBarChartProps) => {
  const resolved = resolveTheme(theme)

  // Flatten ComparisonGroup[] to Recharts-compatible array
  const chartData = useMemo(
    () =>
      data.map(group => ({
        name: group.label,
        support: group.values.support ?? Object.values(group.values)[0],
      })),
    [data]
  )

  if (!data.length) {
    return (
      <div role="status" aria-label="No data available">
        No polling data available.
      </div>
    )
  }

  return (
    <figure
      className={className}
      aria-label={ariaLabel ?? title}
      style={{ width: '100%' }}
    >
      <figcaption
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 12,
          color: resolved.text,
        }}
      >
        {title}
      </figcaption>

      {/* Screen reader data table */}
      <table style={{ position: 'absolute', left: '-9999px' }}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Support (%)</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map(row => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.support.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          role="img"
          aria-label={title}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: resolved.text, fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fill: resolved.text, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="support" radius={[4, 4, 0, 0]}>
            {chartData.map(entry => (
              <Cell
                key={entry.name}
                fill={getCandidateColor(entry.name, resolved)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}

export default CandidateBarChart

// --- Dependencies ---
// npm install recharts
