import { useCallback, useEffect, useState } from 'react'
import { DEEP_DIVES } from '../data/mockData'
import type { InsiderTrade } from '../data/mockData'
import { fetchFmpInsiders, fetchSecInsiders, type DataSource } from '../lib/marketApi'

export function useInsiderFilings(symbol: string) {
  const fallback = DEEP_DIVES[symbol]?.insider ?? DEEP_DIVES.NVDA.insider
  const [rows, setRows] = useState<InsiderTrade[]>(fallback)
  const [source, setSource] = useState<DataSource>('mock')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fmpNote, setFmpNote] = useState<string | null>(null)

  const loadSec = useCallback(async () => {
    const sample = DEEP_DIVES[symbol]?.insider ?? DEEP_DIVES.NVDA.insider
    setLoading(true)
    setError(null)
    setFmpNote(null)
    try {
      const live = await fetchSecInsiders(symbol)
      if (live.length) {
        setRows(live)
        setSource('sec')
      } else {
        setRows(sample)
        setSource('mock')
        setError('SEC returned Form 4 filings, but no transaction rows parsed. Showing sample rows.')
      }
    } catch (err) {
      setRows(sample)
      setSource('mock')
      setError(err instanceof Error ? err.message : 'SEC Form 4 request failed')
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    void loadSec()
  }, [loadSec])

  const testFmp = useCallback(async () => {
    setLoading(true)
    setFmpNote(null)
    try {
      const result = await fetchFmpInsiders(symbol)
      if (result.error) {
        setFmpNote(result.error)
        return
      }
      if (!result.rows.length) {
        setFmpNote('FMP returned JSON but no insider rows for this ticker.')
        return
      }
      setRows(result.rows)
      setSource('fmp')
      setError(null)
      setFmpNote(`Loaded ${result.rows.length} FMP insider rows.`)
    } catch (err) {
      setFmpNote(err instanceof Error ? err.message : 'FMP request failed')
    } finally {
      setLoading(false)
    }
  }, [symbol])

  return { rows, source, loading, error, fmpNote, reloadSec: loadSec, testFmp }
}
