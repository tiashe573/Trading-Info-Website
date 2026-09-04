import { useEffect, useState } from 'react'
import { fetchYahooQuote, type LiveQuote } from '../lib/marketApi'
import type { TimeRange } from '../data/mockData'

export function useLiveQuotes(symbols: string[], timeRange: TimeRange) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const unique = [...new Set(symbols)]
        const results = await Promise.allSettled(
          unique.map((symbol) => fetchYahooQuote(symbol, timeRange)),
        )
        if (cancelled) return
        const next: Record<string, LiveQuote> = {}
        const failures: string[] = []
        results.forEach((result, index) => {
          const symbol = unique[index]!
          if (result.status === 'fulfilled') next[symbol] = result.value
          else failures.push(symbol)
        })
        setQuotes((prev) => ({ ...prev, ...next }))
        if (failures.length && Object.keys(next).length === 0) {
          setError(`Yahoo quotes failed for ${failures.join(', ')}`)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Yahoo quote request failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [symbols.join(','), timeRange])

  return { quotes, loading, error }
}
