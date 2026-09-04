import { Bell, ChevronDown, Search, Workflow } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  NOTIFICATIONS,
  TIME_RANGES,
  TRENDING_SYMBOLS,
  UNIVERSE,
  searchTickers,
  type TimeRange,
  type TickerQuote,
} from '../data/mockData'
import { formatPct, signedClass } from '../lib/format'
import type { LiveQuote } from '../lib/marketApi'
import { SampleBadge } from './SampleBadge'

type TopNavProps = {
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  quotes: Record<string, LiveQuote>
  quotesLoading: boolean
}

export function TopNav({
  timeRange,
  onTimeRangeChange,
  selectedSymbol,
  onSelectSymbol,
  quotes,
  quotesLoading,
}: TopNavProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => searchTickers(query), [query])
  const trending = TRENDING_SYMBOLS.map((symbol) => {
    const base = UNIVERSE.find((t) => t.symbol === symbol)!
    const live = quotes[symbol]
    return live ? { ...base, price: live.price, changePct: live.changePct } : base
  })

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node
      if (searchRef.current && !searchRef.current.contains(target)) setOpen(false)
      if (notesRef.current && !notesRef.current.contains(target)) setNotesOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(ticker: TickerQuote) {
    onSelectSymbol(ticker.symbol)
    setQuery(ticker.symbol)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-flow-border/80 bg-[#090D16]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-5">
        <div className="flex items-center justify-between gap-4 lg:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_24px_rgba(99,102,241,0.35)]">
              <Workflow className="h-5 w-5 text-indigo-300" strokeWidth={2.2} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-flow-green live-dot" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-tight text-white">
                FlowState
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-flow-muted">
                Institutional intelligence
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <TimeRangePills value={timeRange} onChange={onTimeRangeChange} />
          </div>
        </div>

        <div className="relative min-w-0 flex-1" ref={searchRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flow-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search tickers — AAPL, NVDA, TSLA, BABA…"
            className="w-full rounded-xl border border-flow-border bg-flow-panel py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-flow-muted/70 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
          {open && (
            <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-flow-border bg-[#0c1220] shadow-2xl shadow-black/50">
              <div className="border-b border-flow-border px-3 py-2 text-[11px] uppercase tracking-wider text-flow-muted">
                Suggested names
              </div>
              {suggestions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-flow-muted">No matching tickers.</div>
              ) : (
                suggestions.map((ticker) => (
                  <button
                    key={ticker.symbol}
                    type="button"
                    onClick={() => pick(ticker)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-white/5"
                  >
                    <div>
                      <span className="font-mono text-sm font-medium text-white">{ticker.symbol}</span>
                      <span className="ml-2 text-sm text-flow-muted">{ticker.name}</span>
                    </div>
                    <span className={`font-mono text-xs ${signedClass(quotes[ticker.symbol]?.changePct ?? ticker.changePct)}`}>
                      {formatPct(quotes[ticker.symbol]?.changePct ?? ticker.changePct)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5">
          {trending.map((ticker) => {
            const active = ticker.symbol === selectedSymbol
            const up = ticker.changePct >= 0
            return (
              <button
                key={ticker.symbol}
                type="button"
                onClick={() => onSelectSymbol(ticker.symbol)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? 'border-indigo-400/50 bg-indigo-500/15 text-white'
                    : 'border-flow-border bg-flow-panel text-slate-200 hover:border-slate-500'
                }`}
              >
                <span className="font-mono font-semibold">{ticker.symbol}</span>
                <span className={`font-mono ${signedClass(ticker.changePct)}`}>
                  {formatPct(ticker.changePct)}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    quotesLoading
                      ? 'bg-indigo-300/70'
                      : up
                        ? 'bg-flow-green shadow-[0_0_8px_#22d3a6]'
                        : 'bg-flow-red shadow-[0_0_8px_#f43f5e]'
                  }`}
                />
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden lg:block">
            <TimeRangePills value={timeRange} onChange={onTimeRangeChange} />
          </div>

          <div className="relative" ref={notesRef}>
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-flow-border bg-flow-panel text-slate-200 hover:border-indigo-400/40"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-flow-red" />
            </button>
            {notesOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-flow-border bg-[#0c1220] shadow-2xl">
                <div className="flex items-center justify-between border-b border-flow-border px-3 py-2">
                  <span className="text-[11px] uppercase tracking-wider text-flow-muted">Alerts</span>
                  <SampleBadge />
                </div>
                {NOTIFICATIONS.map((note) => (
                  <div key={note.id} className="border-b border-flow-border/70 px-3 py-2.5 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{note.title}</p>
                      <span className="font-mono text-[11px] text-flow-muted">{note.time}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-flow-muted">{note.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-flow-border bg-flow-panel py-1.5 pl-1.5 pr-2.5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
              FS
            </div>
            <span className="hidden text-sm text-slate-200 sm:inline">Analyst</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-flow-muted sm:block" />
          </button>
        </div>
      </div>
    </header>
  )
}

function TimeRangePills({
  value,
  onChange,
}: {
  value: TimeRange
  onChange: (range: TimeRange) => void
}) {
  return (
    <div className="flex rounded-xl border border-flow-border bg-flow-panel p-1">
      {TIME_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          className={`rounded-lg px-2.5 py-1 font-mono text-xs transition ${
            value === range
              ? 'bg-indigo-500/20 text-white shadow-[inset_0_0_0_1px_rgba(129,140,248,0.35)]'
              : 'text-flow-muted hover:text-white'
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  )
}
