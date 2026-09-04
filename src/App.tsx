import { useMemo, useState } from 'react'
import { MacroOverview } from './components/MacroOverview'
import { StockDeepDive } from './components/StockDeepDive'
import { TopNav } from './components/TopNav'
import { TRENDING_SYMBOLS, type TimeRange } from './data/mockData'
import { useLiveQuotes } from './hooks/useLiveQuotes'

export default function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1D')
  const [symbol, setSymbol] = useState('NVDA')
  const quoteSymbols = useMemo(
    () => [...new Set([...TRENDING_SYMBOLS, symbol])],
    [symbol],
  )
  const { quotes, loading: quotesLoading } = useLiveQuotes(quoteSymbols, timeRange)

  return (
    <div className="min-h-svh text-slate-100">
      <TopNav
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        selectedSymbol={symbol}
        onSelectSymbol={setSymbol}
        quotes={quotes}
        quotesLoading={quotesLoading}
      />
      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-5">
        <MacroOverview timeRange={timeRange} />
        <StockDeepDive symbol={symbol} liveQuote={quotes[symbol]} />
        <p className="pb-6 text-center text-[11px] text-flow-muted">
          Live Yahoo quotes + SEC Form 4 filings · FMP demo key is optional · 13F / dark-pool still sample ·
          not investment advice
        </p>
      </main>
    </div>
  )
}
