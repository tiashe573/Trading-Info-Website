import { useEffect, useMemo, useState } from 'react'
import { fetchHousePtrIndex, searchHouseFilings, type HousePtrFiling } from '../lib/capitolApi'

export function useCapitolTrades(query: string) {
  const [rows, setRows] = useState<HousePtrFiling[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchHousePtrIndex()
      .then((next) => {
        if (cancelled) return
        setRows(next)
        if (!next.length) setError('House Clerk index returned no Periodic Transaction Reports.')
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'House Clerk request failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => searchHouseFilings(rows, query), [query, rows])
  const pelosi = useMemo(
    () => rows.filter((row) => row.last.toLowerCase() === 'pelosi' || row.name.toLowerCase().includes('pelosi')),
    [rows],
  )

  return { rows, filtered, pelosi, loading, error }
}
