import { useEffect, useState } from 'react'
import { SECTOR_ETFS, type SectorHeatmapRow } from '../data/sectorEtfs'
import type { TimeRange } from '../data/mockData'
import { fetchYahooSectorSnapshot } from '../lib/marketApi'

const REFRESH_MS = 45_000

export function useSectorHeatmap(timeRange: TimeRange) {
  const [rows, setRows] = useState<SectorHeatmapRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(isRefresh = false) {
      if (!isRefresh) setLoading(true)
      setError(null)
      try {
        const results = await Promise.allSettled(
          SECTOR_ETFS.map((sector) => fetchYahooSectorSnapshot(sector.symbol, timeRange)),
        )
        if (cancelled) return
        const next: SectorHeatmapRow[] = []
        results.forEach((result, index) => {
          const meta = SECTOR_ETFS[index]!
          if (result.status === 'fulfilled') {
            next.push({
              name: meta.name,
              symbol: meta.symbol,
              changePct: result.value.changePct,
              flowProxy: result.value.flowProxy,
              price: result.value.price,
            })
          }
        })
        if (!next.length) {
          setError('Yahoo sector ETF request failed')
          return
        }
        setRows(next)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Sector heatmap request failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load(false)
    const timer = window.setInterval(() => void load(true), REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [timeRange])

  return { rows, loading, error }
}
