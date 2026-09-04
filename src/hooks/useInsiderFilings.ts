import { useCallback, useEffect, useState } from 'react'
import { DEEP_DIVES } from '../data/mockData'
import type { InsiderTrade } from '../data/mockData'
import { fetchFmpInsiders, fetchSecInsiders, type DataSource } from '../lib/marketApi'

const PAGE_SIZE = 25

export function useInsiderFilings(symbol: string) {
  const fallback = DEEP_DIVES[symbol]?.insider ?? []
  const [rows, setRows] = useState<InsiderTrade[]>(fallback)
  const [source, setSource] = useState<DataSource>('mock')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fmpNote, setFmpNote] = useState<string | null>(null)
  const [nextOffset, setNextOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalForm4, setTotalForm4] = useState(0)
  const [filingsLoaded, setFilingsLoaded] = useState(0)

  const loadSec = useCallback(async () => {
    const sample = DEEP_DIVES[symbol]?.insider
    setLoading(true)
    setError(null)
    setFmpNote(null)
    setNextOffset(0)
    setHasMore(false)
    try {
      const page = await fetchSecInsiders(symbol, { offset: 0, filingCount: PAGE_SIZE })
      if (page.rows.length) {
        setRows(page.rows)
        setSource('sec')
        setNextOffset(page.nextOffset)
        setHasMore(page.hasMore)
        setTotalForm4(page.totalForm4)
        setFilingsLoaded(page.fetchedFilings)
      } else if (sample?.length) {
        setRows(sample)
        setSource('mock')
        setError('SEC returned Form 4 filings, but no transaction rows parsed. Showing sample rows.')
      } else {
        setRows([])
        setSource('sec')
        setError('No recent Form 4 transactions parsed for this issuer.')
      }
    } catch (err) {
      if (sample?.length) {
        setRows(sample)
        setSource('mock')
        setError(err instanceof Error ? err.message : 'SEC Form 4 request failed')
      } else {
        setRows([])
        setSource('sec')
        setError(err instanceof Error ? err.message : 'SEC Form 4 request failed')
      }
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    void loadSec()
  }, [loadSec])

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await fetchSecInsiders(symbol, { offset: nextOffset, filingCount: PAGE_SIZE })
      setRows((prev) => [...prev, ...page.rows])
      setNextOffset(page.nextOffset)
      setHasMore(page.hasMore)
      setTotalForm4(page.totalForm4)
      setFilingsLoaded((prev) => prev + page.fetchedFilings)
      setSource('sec')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more Form 4 filings')
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextOffset, symbol])

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
      setHasMore(false)
      setFmpNote(`Loaded ${result.rows.length} FMP insider rows.`)
    } catch (err) {
      setFmpNote(err instanceof Error ? err.message : 'FMP request failed')
    } finally {
      setLoading(false)
    }
  }, [symbol])

  return {
    rows,
    source,
    loading,
    loadingMore,
    error,
    fmpNote,
    hasMore,
    totalForm4,
    filingsLoaded,
    reloadSec: loadSec,
    loadMore,
    testFmp,
  }
}
