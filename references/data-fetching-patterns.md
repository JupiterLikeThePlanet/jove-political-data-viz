# Data Fetching Patterns

All patterns here are library-agnostic at the fetch layer.
The adapter pattern normalizes any API shape before it reaches a component.

---

## Core Rule

Never pass raw API data directly to a chart or map component.
Always run it through an adapter function first.

```
Raw API response → adapterFn() → canonical shape → component
```

---

## Single Source Pattern

### TanStack Query (recommended)

```tsx
import { useQuery } from '@tanstack/react-query'
import { apAdapter } from '../adapters/ap'

const usePollingData = (raceId: string) => {
  return useQuery({
    queryKey: ['polling', raceId],
    queryFn: async () => {
      const res = await fetch(`/api/polling/${raceId}`)
      if (!res.ok) throw new Error('Failed to fetch polling data')
      const raw = await res.json()
      return apAdapter(raw) // normalize before returning
    },
    staleTime: 30_000,      // 30 seconds
    refetchInterval: 30_000, // poll every 30 seconds for live data
  })
}

// In component
const { data, isLoading, isError, dataUpdatedAt } = usePollingData(raceId)
```

### SWR (equivalent)

```tsx
import useSWR from 'swr'
import { apAdapter } from '../adapters/ap'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const raw = await res.json()
  return apAdapter(raw)
}

const { data, error, isLoading } = useSWR(`/api/polling/${raceId}`, fetcher, {
  refreshInterval: 30_000,
})
```

### Plain useEffect (fallback)

```tsx
const [data, setData] = useState<TimeSeriesPoint[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<Error | null>(null)

useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/polling/${raceId}`)
      const raw = await res.json()
      setData(apAdapter(raw))
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }
  fetchData()
  const interval = setInterval(fetchData, 30_000)
  return () => clearInterval(interval)
}, [raceId])
```

---

## Multi-Source Pattern

Fetch from multiple providers in parallel. Normalize each independently.
Merge after all adapters run. Track error and stale state per source.

```tsx
import { useQueries } from '@tanstack/react-query'

type SourceConfig = {
  id: string
  url: string
  adapter: (raw: unknown) => TimeSeriesPoint[]
}

const sources: SourceConfig[] = [
  { id: 'ap',  url: '/api/mock/ap',  adapter: apAdapter },
  { id: 'nbc', url: '/api/mock/nbc', adapter: nbcAdapter },
  { id: 'cnn', url: '/api/mock/cnn', adapter: cnnAdapter },
]

const useMultiSourcePolling = () => {
  const results = useQueries({
    queries: sources.map(source => ({
      queryKey: ['polling', source.id],
      queryFn: async () => {
        const res = await fetch(source.url)
        if (!res.ok) throw new Error(`${source.id} fetch failed`)
        const raw = await res.json()
        return { id: source.id, data: source.adapter(raw) }
      },
      staleTime: 30_000,
      refetchInterval: 30_000,
    }))
  })

  const sourceStates = results.map((result, i) => ({
    id: sources[i].id,
    data: result.data?.data ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
    updatedAt: result.dataUpdatedAt,
  }))

  // Merge all normalized data into one array for the chart
  const merged = sourceStates.flatMap(s => s.data)

  return { sourceStates, merged }
}
```

---

## Adapter Pattern

One adapter per data provider. Each adapter takes raw API response
and returns the canonical shape for its chart category.

### Time Series Adapter Example (AP)

```ts
// Raw AP shape
type APRawResponse = {
  candidate: string
  pct: number
  date: string
  pollster?: string
}[]

// Canonical shape
type TimeSeriesPoint = {
  date: string
  candidates: Record<string, number>
  source?: string
  isStale?: boolean
}

export const apAdapter = (raw: APRawResponse): TimeSeriesPoint[] => {
  // Group by date
  const grouped = raw.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = { date: item.date, candidates: {}, source: 'ap' }
    acc[item.date].candidates[item.candidate.toLowerCase()] = item.pct
    return acc
  }, {} as Record<string, TimeSeriesPoint>)

  return Object.values(grouped).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}
```

### Comparison Adapter Example (NBC)

```ts
// Raw NBC shape — note different field names
type NBCRawResponse = {
  candidateName: string
  share: number         // 0-1 decimal, not percentage
  demographic?: string
}[]

type ComparisonGroup = {
  label: string
  values: Record<string, number>
  total?: number
}

export const nbcComparisonAdapter = (raw: NBCRawResponse): ComparisonGroup[] => {
  const grouped = raw.reduce((acc, item) => {
    const label = item.demographic ?? 'Overall'
    if (!acc[label]) acc[label] = { label, values: {} }
    acc[label].values[item.candidateName.toLowerCase()] = item.share * 100 // normalize to %
    return acc
  }, {} as Record<string, ComparisonGroup>)

  return Object.values(grouped)
}
```

### CSV Data Adapter

Historical election data is frequently distributed as CSV (state
election boards, Census, MIT Election Lab), not JSON, and has failure
modes the JSON adapters above never hit:

- A naive `line.split(',')` breaks on any quoted field containing a
  comma — e.g. a state name like `"Washington, D.C."`, which is valid
  CSV but not valid input to a plain split.
- Some files have a BOM (byte-order-mark) character on the header row
  (`﻿State` instead of `State`), which breaks a direct key lookup like
  `row.State` unless the file is read as `utf-8-sig` or the BOM is
  stripped first.
- Vote counts are often formatted as comma-separated thousands,
  sometimes only in some rows (`"93,007"` vs `96373`) — strip commas
  before `Number()`/`parseFloat`, don't assume one format throughout.
- Real source files can simply have bad data — duplicate rows, blank
  trailing lines. Dedupe defensively (e.g. by a unique key per row)
  rather than trusting row count.

```ts
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (inQuotes) {
      if (char === '"') inQuotes = false
      else current += char
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

function numberFrom(raw: string): number {
  return Number(raw.replace(/,/g, '')) // strip thousands separators
}

export function csvElectionAdapter(text: string) {
  const cleaned = text.replace(/^﻿/, '').trim() // strip BOM if present
  const lines = cleaned.split('\n').filter(l => l.trim().length > 0)
  const header = parseCsvLine(lines[0]).map(h => h.trim())

  const seen = new Set<string>()
  return lines.slice(1).flatMap(line => {
    const values = parseCsvLine(line)
    const row = Object.fromEntries(header.map((key, i) => [key, (values[i] ?? '').trim()]))
    if (seen.has(row.Abbreviation)) return [] // defend against duplicate rows
    seen.add(row.Abbreviation)
    return [{ ...row, votes: numberFrom(row.Votes) }]
  })
}
```

---

## Stale Data Indicator

Show users when data is old. Calculate from TanStack Query's dataUpdatedAt.

```tsx
const StaleIndicator = ({ updatedAt }: { updatedAt: number }) => {
  const secondsAgo = Math.floor((Date.now() - updatedAt) / 1000)
  const isStale = secondsAgo > 60

  return (
    <span
      className={isStale ? 'text-yellow-500' : 'text-gray-400'}
      aria-live="polite"
    >
      {isStale
        ? `Data may be stale — last updated ${secondsAgo}s ago`
        : `Updated ${secondsAgo}s ago`
      }
    </span>
  )
}
```

---

## GraphQL (Apollo)

```tsx
import { useQuery, gql } from '@apollo/client'

const POLLING_QUERY = gql`
  query GetPolling($raceId: ID!) {
    polling(raceId: $raceId) {
      candidate
      percentage
      date
      source
    }
  }
`

const { data, loading, error } = useQuery(POLLING_QUERY, {
  variables: { raceId },
  pollInterval: 30_000,
})

const normalized = data ? graphqlAdapter(data.polling) : []
```
