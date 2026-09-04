import { useMemo, useState } from 'react'
import { CapitolTracker } from './components/CapitolTracker'
import { MacroOverview } from './components/MacroOverview'
import { StockDeepDive } from './components/StockDeepDive'
import { TopNav } from './components/TopNav'
import { TRENDING_SYMBOLS, UNIVERSE, type TimeRange } from './data/mockData'
import { useLiveQuotes } from './hooks/useLiveQuotes'
import type { CompanyRecord } from './lib/marketApi'

export default function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1D')
  const [symbol, setSymbol] = useState('NVDA')
  const [companyName, setCompanyName] = useState('NVIDIA Corporation')
  const quoteSymbols = useMemo(
    () => [...new Set([...TRENDING_SYMBOLS, symbol])],
    [symbol],
  )
  const { quotes, loading: quotesLoading } = useLiveQuotes(quoteSymbols, timeRange)

  function selectCompany(company: CompanyRecord | string, name?: string) {
    if (typeof company === 'string') {
      setSymbol(company)
      setCompanyName(name || UNIVERSE.find((row) => row.symbol === company)?.name || company)
      return
    }
    setSymbol(company.ticker)
    setCompanyName(company.name)
  }

  return (
    <div className="min-h-svh text-slate-100">
      <TopNav
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        selectedSymbol={symbol}
        onSelectSymbol={(ticker, name) => selectCompany(ticker, name)}
        quotes={quotes}
        quotesLoading={quotesLoading}
      />
      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-5">
        <MacroOverview timeRange={timeRange} />
        <CapitolTracker />
        <StockDeepDive
          symbol={symbol}
          companyName={companyName}
          liveQuote={quotes[symbol]}
          onSelectCompany={selectCompany}
        />
        <p className="pb-6 text-center text-[11px] text-flow-muted">
          Live Yahoo quotes & sector ETFs · House Clerk Capitol Tracker · SEC Form 4 pool · 13F / dark-pool still sample
          · not investment advice
        </p>
      </main>
    </div>
  )
}
