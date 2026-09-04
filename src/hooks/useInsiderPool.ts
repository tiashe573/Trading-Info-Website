import { useCallback, useEffect, useState } from 'react'
import { fetchInsiderVolumePool, type InsiderPoolRow } from '../lib/marketApi'

export function useInsiderPool() {
  const [rows, setRows] = useState<InsiderPoolRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchInsiderVolumePool(22)
      setRows(next)
      if (!next.length) setError('No recent Form 4 issuer filings parsed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Insider pool request failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { rows, loading, error, reload }
}
