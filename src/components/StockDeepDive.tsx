import { Activity, Database, ExternalLink, Layers3, RefreshCw, Shield, Waves } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DEEP_DIVES, UNIVERSE, type DeepDiveTab, type InsiderTrade, type TradeAction } from '../data/mockData'
import { useInsiderFilings } from '../hooks/useInsiderFilings'
import { useInsiderPool } from '../hooks/useInsiderPool'
import { formatPct, formatShares, formatUSD, signedClass } from '../lib/format'
import type { CompanyRecord, InsiderPoolRow, LiveQuote } from '../lib/marketApi'
import { CompanySearch } from './CompanySearch'
import { SampleBadge } from './SampleBadge'

const TABS: { id: DeepDiveTab; label: string; mock?: boolean }[] = [
  { id: 'insider', label: 'Insider Activity' },
  { id: '13f', label: '13F Holdings', mock: true },
  { id: 'sweeps', label: 'Option Sweeps', mock: true },
  { id: 'darkpool', label: 'Dark Pool Flows', mock: true },
]

type StockDeepDiveProps = {
  symbol: string
  companyName?: string
  liveQuote?: LiveQuote
  onSelectCompany: (company: CompanyRecord) => void
}

export function StockDeepDive({ symbol, companyName, liveQuote, onSelectCompany }: StockDeepDiveProps) {
  const [tab, setTab] = useState<DeepDiveTab>('insider')
  const data = DEEP_DIVES[symbol]
  const insiders = useInsiderFilings(symbol)
  const pool = useInsiderPool()
  const fallbackQuote = UNIVERSE.find((row) => row.symbol === symbol)
  const quote = {
    symbol,
    name: companyName || data?.quote.name || fallbackQuote?.name || symbol,
    sector: data?.quote.sector || fallbackQuote?.sector || 'U.S. listed',
    price: liveQuote?.price ?? data?.quote.price ?? fallbackQuote?.price ?? 0,
    changePct: liveQuote?.changePct ?? data?.quote.changePct ?? fallbackQuote?.changePct ?? 0,
  }
  const up = quote.changePct >= 0

  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-2xl border border-flow-border bg-flow-panel/80">
        <div className="flex flex-col gap-3 border-b border-flow-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-white">Stock deep-dive</h2>
              <span className="rounded-md border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 font-mono text-xs text-indigo-200">
                Featured
              </span>
              {liveQuote ? (
                <span className="rounded-md border border-flow-green/30 bg-flow-green/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-flow-green">
                  Yahoo live
                </span>
              ) : (
                <SampleBadge />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <span className="font-mono text-2xl font-semibold text-white">{quote.symbol}</span>
              <span className="text-sm text-flow-muted">{quote.name}</span>
              <span className="font-mono text-lg text-white">{quote.price.toFixed(2)}</span>
              <span className={`font-mono text-sm ${signedClass(quote.changePct)}`}>
                {formatPct(quote.changePct)}
              </span>
              <span className="rounded-full border border-flow-border px-2 py-0.5 text-[11px] text-flow-muted">
                {quote.sector}
              </span>
            </div>
          </div>
          <div className={`hidden h-10 items-end gap-0.5 sm:flex ${up ? 'text-flow-green' : 'text-flow-red'}`}>
            <Sparkline values={liveQuote?.sparkline} up={up} />
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-flow-border px-3 py-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === item.id
                  ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(129,140,248,0.35)]'
                  : 'text-flow-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
              {item.mock && <SampleBadge className="ml-1.5" />}
            </button>
          ))}
        </div>

        <div className="p-3 sm:p-4">
          {tab === 'insider' && (
            <InsiderTable
              symbol={symbol}
              rows={insiders.rows}
              loading={insiders.loading}
              loadingMore={insiders.loadingMore}
              source={insiders.source}
              error={insiders.error}
              fmpNote={insiders.fmpNote}
              hasMore={insiders.hasMore}
              totalForm4={insiders.totalForm4}
              filingsLoaded={insiders.filingsLoaded}
              pool={pool.rows}
              poolLoading={pool.loading}
              poolError={pool.error}
              onReloadSec={() => void insiders.reloadSec()}
              onLoadMore={() => void insiders.loadMore()}
              onReloadPool={() => void pool.reload()}
              onTestFmp={() => void insiders.testFmp()}
              onSelectCompany={onSelectCompany}
            />
          )}
          {tab === '13f' &&
            (data ? (
              <Holdings13F rows={data.funds} />
            ) : (
              <EmptyMockTab label="13F sample is only available for the original watchlist tickers." />
            ))}
          {tab === 'sweeps' &&
            (data ? (
              <OptionSweeps rows={data.sweeps} />
            ) : (
              <EmptyMockTab label="Option-sweep sample is only available for the original watchlist tickers." />
            ))}
          {tab === 'darkpool' &&
            (data ? (
              <DarkPoolTable rows={data.darkPool} />
            ) : (
              <EmptyMockTab label="Dark-pool sample is only available for the original watchlist tickers." />
            ))}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-white">Whale alerts</h3>
            <p className="text-[11px] text-flow-muted">
              {data ? `Sample unusual prints · ${quote.symbol}` : `No sample whale tape for ${quote.symbol}`}
            </p>
          </div>
          <SampleBadge />
        </div>
        {(data?.whales ?? []).map((alert) => (
          <article
            key={alert.id}
            className="rounded-2xl border border-flow-border bg-flow-card/70 p-3.5 transition hover:border-indigo-400/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-300">
                {alert.kind === 'Option Sweep' ? (
                  <Activity className="h-4 w-4" />
                ) : alert.kind === 'Dark Pool' ? (
                  <Waves className="h-4 w-4" />
                ) : (
                  <Layers3 className="h-4 w-4" />
                )}
                <span className="text-[10px] uppercase tracking-wider text-flow-muted">{alert.kind}</span>
              </div>
              <span className="font-mono text-[11px] text-flow-muted">{alert.timeAgo}</span>
            </div>
            <h4 className="mt-2 text-sm font-medium text-white">{alert.headline}</h4>
            <p className="mt-1 text-xs leading-relaxed text-flow-muted">{alert.detail}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-sm text-slate-200">{formatUSD(alert.notional)}</span>
              <SentimentBadge sentiment={alert.sentiment} />
            </div>
          </article>
        ))}
      </aside>
    </section>
  )
}

function InsiderTable({
  symbol,
  rows,
  loading,
  loadingMore,
  source,
  error,
  fmpNote,
  pool,
  poolLoading,
  poolError,
  hasMore,
  totalForm4,
  filingsLoaded,
  onReloadSec,
  onReloadPool,
  onLoadMore,
  onTestFmp,
  onSelectCompany,
}: {
  symbol: string
  rows: InsiderTrade[]
  loading: boolean
  loadingMore: boolean
  source: 'sec' | 'fmp' | 'mock'
  error: string | null
  fmpNote: string | null
  pool: InsiderPoolRow[]
  poolLoading: boolean
  poolError: string | null
  hasMore: boolean
  totalForm4: number
  filingsLoaded: number
  onReloadSec: () => void
  onReloadPool: () => void
  onLoadMore: () => void
  onTestFmp: () => void
  onSelectCompany: (company: CompanyRecord) => void
}) {
  const sourceLabel =
    source === 'sec' ? 'SEC EDGAR Form 4' : source === 'fmp' ? 'FMP insider API' : 'Sample data'
  const topBuy = [...pool].sort((a, b) => b.buyValue - a.buyValue)[0]
  const topSell = [...pool].sort((a, b) => b.sellValue - a.sellValue)[0]

  return (
    <div className="space-y-3">
      <CompanySearch onSelect={onSelectCompany} />

      <div className="rounded-xl border border-flow-border bg-[#0c1220] p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-white">Recent Form 4 volume pool</p>
            <p className="text-[11px] text-flow-muted">
              Ranked by open-market buy + sell dollars from the latest SEC current filings
            </p>
          </div>
          <button
            type="button"
            onClick={onReloadPool}
            className="inline-flex items-center gap-1.5 rounded-lg border border-flow-border px-2 py-1 text-[11px] text-slate-200 hover:border-indigo-400/40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${poolLoading ? 'animate-spin' : ''}`} />
            Refresh pool
          </button>
        </div>
        {poolError && <p className="mb-2 text-[11px] text-amber-200">{poolError}</p>}
        {topBuy && topSell && (
          <p className="mb-2 text-[11px] text-flow-muted">
            Heaviest buying: <span className="font-mono text-flow-green">{topBuy.ticker}</span> · Heaviest selling:{' '}
            <span className="font-mono text-flow-red">{topSell.ticker}</span>
          </p>
        )}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {poolLoading && pool.length === 0 && (
            <div className="px-2 py-3 text-xs text-flow-muted">Scanning latest Form 4 issuers…</div>
          )}
          {pool.map((row) => {
            const active = row.ticker === symbol
            const sellLed = row.sellValue > row.buyValue
            return (
              <button
                key={row.ticker}
                type="button"
                onClick={() => onSelectCompany({ ticker: row.ticker, name: row.name, cik: row.cik })}
                className={`min-w-[168px] shrink-0 rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? 'border-indigo-400/50 bg-indigo-500/15'
                    : 'border-flow-border bg-flow-panel/80 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-white">{row.ticker}</span>
                  <span className={`text-[10px] uppercase ${sellLed ? 'text-flow-red' : 'text-flow-green'}`}>
                    {sellLed ? 'Sell' : 'Buy'}
                  </span>
                </div>
                <div className="mt-1 truncate text-[11px] text-flow-muted">{row.name}</div>
                <div className="mt-2 flex justify-between font-mono text-[10px]">
                  <span className="text-flow-green">+{formatUSD(row.buyValue)}</span>
                  <span className="text-flow-red">-{formatUSD(row.sellValue)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-flow-muted">
          Source:{' '}
          <span className={source === 'mock' ? 'text-amber-200' : 'text-flow-green'}>{sourceLabel}</span>
          {source === 'mock' && <SampleBadge className="ml-2" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReloadSec}
            className="inline-flex items-center gap-1.5 rounded-lg border border-flow-border bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 hover:border-indigo-400/40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reload SEC
          </button>
          <button
            type="button"
            onClick={onTestFmp}
            className="inline-flex items-center gap-1.5 rounded-lg border border-flow-border bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 hover:border-indigo-400/40"
          >
            <Database className="h-3.5 w-3.5" />
            Test FMP API
          </button>
        </div>
      </div>
      {(error || fmpNote) && (
        <p className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {fmpNote ?? error}
        </p>
      )}
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-flow-border text-[11px] uppercase tracking-wider text-flow-muted">
            <th className="px-3 py-2 font-medium">Insider</th>
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Action</th>
            <th className="px-3 py-2 font-medium text-right">Shares</th>
            <th className="px-3 py-2 font-medium text-right">Value</th>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium text-center">Filing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-flow-border/70 transition hover:bg-white/[0.035]"
            >
              <td className="px-3 py-2.5 font-medium text-white">{row.name}</td>
              <td className="px-3 py-2.5 text-flow-muted">{row.title}</td>
              <td className="px-3 py-2.5">
                <ActionBadge action={row.action} />
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-200">{formatShares(row.shares)}</td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-200">{formatUSD(row.value, false)}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-flow-muted">{row.date}</td>
              <td className="px-3 py-2.5 text-center">
                <a
                  href={row.filingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-md p-1.5 text-indigo-300 hover:bg-indigo-500/10"
                  aria-label={`SEC filing for ${row.name}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && rows.length === 0 && (
        <p className="px-3 py-6 text-center text-sm text-flow-muted">No insider rows for this ticker.</p>
      )}
      {source === 'sec' && totalForm4 > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-[11px] text-flow-muted">
            Showing {rows.length} transactions from {filingsLoaded} of {totalForm4} Form 4 filings. One filing can
            contain many lots (that is why the same director may repeat).
          </p>
          {hasMore && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-100 hover:bg-indigo-500/20 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingMore ? 'animate-spin' : ''}`} />
              {loadingMore ? 'Loading…' : 'Load older Form 4s'}
            </button>
          )}
        </div>
      )}
    </div>
    </div>
  )
}

function EmptyMockTab({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-flow-border px-4 py-8 text-center text-sm text-flow-muted">
      {label}
    </div>
  )
}

function Holdings13F({ rows }: { rows: (typeof DEEP_DIVES)['NVDA']['funds'] }) {
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.changeShares)))
  return (
    <div className="space-y-2">
      <div className="mb-1 flex items-center gap-2">
        <SampleBadge />
        <span className="text-[11px] text-flow-muted">Illustrative 13F adds/trims — not live filings</span>
      </div>
      {rows.map((row) => {
        const width = `${Math.max(8, (Math.abs(row.changeShares) / maxAbs) * 100)}%`
        const add = row.changeShares >= 0
        return (
          <div
            key={row.fund}
            className="grid items-center gap-3 rounded-xl border border-flow-border/80 px-3 py-2.5 transition hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto]"
          >
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-violet-300" />
                <span className="text-sm font-medium text-white">{row.fund}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-flow-muted">
                AUM {row.aum} · {row.quarter} · {row.weightPct}% of float
              </div>
            </div>
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${add ? 'bg-flow-green' : 'bg-flow-red'}`}
                  style={{ width }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[11px] text-flow-muted">
                <span>{formatShares(row.shares)} sh</span>
                <span className={signedClass(row.changeShares)}>
                  {add ? '+' : ''}
                  {formatShares(row.changeShares)}
                </span>
              </div>
            </div>
            <span
              className={`justify-self-end rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                add
                  ? 'border-flow-green/30 bg-flow-green/10 text-flow-green'
                  : 'border-flow-red/30 bg-flow-red/10 text-flow-red'
              }`}
            >
              {add ? 'Adding' : 'Reducing'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function OptionSweeps({ rows }: { rows: (typeof DEEP_DIVES)['NVDA']['sweeps'] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <SampleBadge />
        <span className="text-[11px] text-flow-muted">Illustrative option sweeps — not live options flow</span>
      </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-flow-border text-[11px] uppercase tracking-wider text-flow-muted">
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">Contract</th>
            <th className="px-3 py-2 font-medium">Sentiment</th>
            <th className="px-3 py-2 font-medium text-right">Notional</th>
            <th className="px-3 py-2 font-medium text-right">Size</th>
            <th className="px-3 py-2 font-medium text-right">Premium</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-flow-border/70 transition hover:bg-white/[0.035]">
              <td className="px-3 py-2.5 font-mono text-xs text-flow-muted">{row.timeAgo}</td>
              <td className="px-3 py-2.5">
                <div className="font-mono text-white">
                  {row.strike}
                  {row.type === 'call' ? 'C' : 'P'} {row.expiry}
                </div>
                <div className="text-[11px] text-flow-muted">Spot {row.spot.toFixed(2)}</div>
              </td>
              <td className="px-3 py-2.5">
                <SentimentBadge sentiment={row.sentiment} />
              </td>
              <td className="px-3 py-2.5 text-right font-mono">{formatUSD(row.notional)}</td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-200">{row.size}</td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-200">${row.premium.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  )
}

function DarkPoolTable({ rows }: { rows: (typeof DEEP_DIVES)['NVDA']['darkPool'] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <SampleBadge />
        <span className="text-[11px] text-flow-muted">Illustrative dark-pool prints — not live ATS data</span>
      </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-flow-border text-[11px] uppercase tracking-wider text-flow-muted">
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">Venue</th>
            <th className="px-3 py-2 font-medium">Side</th>
            <th className="px-3 py-2 font-medium text-right">Size</th>
            <th className="px-3 py-2 font-medium text-right">Notional</th>
            <th className="px-3 py-2 font-medium text-right">Price</th>
            <th className="px-3 py-2 font-medium text-right">vs VWAP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-flow-border/70 transition hover:bg-white/[0.035]">
              <td className="px-3 py-2.5 font-mono text-xs text-flow-muted">{row.timeAgo}</td>
              <td className="px-3 py-2.5 text-white">{row.venue}</td>
              <td className="px-3 py-2.5">
                <SideBadge side={row.side} />
              </td>
              <td className="px-3 py-2.5 text-right font-mono">{formatShares(row.size)}</td>
              <td className="px-3 py-2.5 text-right font-mono">{formatUSD(row.notional)}</td>
              <td className="px-3 py-2.5 text-right font-mono">{row.price.toFixed(2)}</td>
              <td className={`px-3 py-2.5 text-right font-mono ${signedClass(row.vsVwapBps)}`}>
                {row.vsVwapBps > 0 ? '+' : ''}
                {row.vsVwapBps} bps
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  )
}

function ActionBadge({ action }: { action: TradeAction }) {
  const styles: Record<TradeAction, string> = {
    Buy: 'border-flow-green/30 bg-flow-green/10 text-flow-green',
    Sell: 'border-flow-red/30 bg-flow-red/10 text-flow-red',
    'Option Exercise': 'border-violet-400/30 bg-violet-500/10 text-violet-200',
    Gift: 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200',
    Award: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
    Tax: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    Other: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  }
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[action]}`}>
      {action}
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment: 'Bullish' | 'Bearish' | 'Neutral' }) {
  const styles = {
    Bullish: 'border-flow-green/30 bg-flow-green/10 text-flow-green',
    Bearish: 'border-flow-red/30 bg-flow-red/10 text-flow-red',
    Neutral: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  }
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[sentiment]}`}>
      {sentiment}
    </span>
  )
}

function SideBadge({ side }: { side: 'Buy' | 'Sell' | 'Mixed' }) {
  const styles = {
    Buy: 'border-flow-green/30 bg-flow-green/10 text-flow-green',
    Sell: 'border-flow-red/30 bg-flow-red/10 text-flow-red',
    Mixed: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  }
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[side]}`}>
      {side}
    </span>
  )
}

function Sparkline({ values, up }: { values?: number[]; up: boolean }) {
  const points = useMemo(() => {
    const series =
      values && values.length > 1
        ? values
        : up
          ? [18, 22, 19, 28, 24, 32, 30, 38, 34, 44]
          : [44, 40, 42, 35, 36, 28, 30, 22, 24, 18]
    const min = Math.min(...series)
    const max = Math.max(...series)
    const span = max - min || 1
    return series
      .map((value, i) => {
        const x = series.length === 1 ? 0 : (i / (series.length - 1)) * 108
        const y = 44 - ((value - min) / span) * 36
        return `${x},${y}`
      })
      .join(' ')
  }, [up, values])

  return (
    <svg width="120" height="40" viewBox="0 0 108 48" className="overflow-visible">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

