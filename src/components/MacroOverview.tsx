import { ArrowDownRight, ArrowUpRight, Building2, Cpu, Landmark } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { MACRO_BY_RANGE, type TimeRange } from '../data/mockData'
import { useSectorHeatmap } from '../hooks/useSectorHeatmap'
import { formatPct, formatUSD, signedClass } from '../lib/format'
import { LiveBadge, SampleBadge } from './SampleBadge'

type HeatmapMode = 'performance' | 'flow'

type MacroOverviewProps = {
  timeRange: TimeRange
}

export function MacroOverview({ timeRange }: MacroOverviewProps) {
  const [mode, setMode] = useState<HeatmapMode>('performance')
  const macro = MACRO_BY_RANGE[timeRange]
  const { rows, loading, error } = useSectorHeatmap(timeRange)
  const live = rows.length > 0

  const ranked = useMemo(() => {
    if (!live) return []
    return [...rows].sort((a, b) =>
      mode === 'flow' ? b.flowProxy - a.flowProxy : b.changePct - a.changePct,
    )
  }, [live, mode, rows])

  const leader = ranked[0]
  const proxyInflow = rows.reduce((sum, row) => sum + row.flowProxy, 0)
  const avgPct = rows.length ? rows.reduce((sum, row) => sum + row.changePct, 0) / rows.length : 0

  const maxAbs = Math.max(
    0.0001,
    ...rows.map((row) => Math.abs(mode === 'flow' ? row.flowProxy : row.changePct)),
  )

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-white">Market-wide flow</h2>
            {live ? <LiveBadge label="Yahoo ETFs" /> : <SampleBadge />}
          </div>
          <p className="text-xs text-flow-muted">
            Macro view · U.S. sector ETFs · {timeRange}
            {mode === 'flow' ? ' dollar-volume proxy' : ' price performance'}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          icon={<Landmark className="h-4 w-4" />}
          label="ETF net-flow proxy"
          value={live ? formatUSD(proxyInflow) : formatUSD(macro.institutionalNetInflow)}
          delta={live ? avgPct : macro.institutionalDeltaPct}
          hint={live ? 'Typical price × volume × close vs open (not 13F)' : 'Sample 13F-style figure'}
        />
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          label="SEC Form 4 insider net"
          value={formatUSD(macro.insiderNet)}
          delta={macro.insiderDeltaPct}
          hint="Open-market buys minus sales (sample market-wide)"
          invertColors
          badge={<SampleBadge />}
        />
        <StatCard
          icon={<Cpu className="h-4 w-4" />}
          label="Top sector"
          value={leader?.name ?? macro.topInflowSector}
          subValue={
            leader
              ? mode === 'flow'
                ? formatUSD(leader.flowProxy)
                : formatPct(leader.changePct)
              : formatUSD(macro.topInflowAmount)
          }
          hint={live ? `${leader?.symbol ?? ''} · ${timeRange} Yahoo leadership` : `${timeRange} sample leadership`}
        />
      </div>

      <div className="rounded-2xl border border-flow-border bg-flow-panel/80 p-4">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-white">Sector flow heatmap</h3>
              {live ? <LiveBadge label={loading ? 'Updating' : 'Live'} /> : <SampleBadge />}
            </div>
            <p className="text-[11px] text-flow-muted">
              {mode === 'performance'
                ? 'Sector ETF price change vs previous close'
                : 'Net flow proxy: Σ (typical price × volume × direction)'}
            </p>
            {error && <p className="mt-1 text-[11px] text-amber-200">{error}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-flow-border bg-[#0c1220] p-1">
              <button
                type="button"
                onClick={() => setMode('performance')}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition ${
                  mode === 'performance'
                    ? 'bg-indigo-500/20 text-white shadow-[inset_0_0_0_1px_rgba(129,140,248,0.35)]'
                    : 'text-flow-muted hover:text-white'
                }`}
              >
                ETF %
              </button>
              <button
                type="button"
                onClick={() => setMode('flow')}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition ${
                  mode === 'flow'
                    ? 'bg-indigo-500/20 text-white shadow-[inset_0_0_0_1px_rgba(129,140,248,0.35)]'
                    : 'text-flow-muted hover:text-white'
                }`}
              >
                Net flow proxy $
              </button>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-flow-muted">
              <span className="h-2 w-8 rounded-full bg-gradient-to-r from-flow-red to-slate-700" />
              Weak
              <span className="h-2 w-8 rounded-full bg-gradient-to-r from-slate-700 to-flow-green" />
              Strong
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {(live ? rows : []).map((sector) => {
            const metric = mode === 'flow' ? sector.flowProxy : sector.changePct
            const intensity = Math.abs(metric) / maxAbs
            const buy = metric >= 0
            const bg = buy
              ? `rgba(34, 211, 166, ${0.08 + intensity * 0.38})`
              : `rgba(244, 63, 94, ${0.08 + intensity * 0.38})`
            const glow = buy ? '0 0 18px rgba(34, 211, 166, 0.12)' : '0 0 18px rgba(244, 63, 94, 0.12)'
            return (
              <div
                key={sector.symbol}
                className="rounded-xl border border-white/5 p-3 transition hover:border-white/15"
                style={{ background: bg, boxShadow: intensity > 0.7 ? glow : undefined }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-medium text-slate-200">{sector.name}</div>
                  <span className="font-mono text-[10px] text-flow-muted">{sector.symbol}</span>
                </div>
                <div className={`mt-2 font-mono text-sm font-semibold ${signedClass(metric)}`}>
                  {mode === 'flow'
                    ? `${metric >= 0 ? '+' : ''}${formatUSD(metric)}`
                    : formatPct(sector.changePct)}
                </div>
                <div className={`mt-1 font-mono text-[11px] ${signedClass(mode === 'flow' ? sector.changePct : metric)}`}>
                  {mode === 'flow' ? `${formatPct(sector.changePct)} vs prior` : `Last ${sector.price.toFixed(2)}`}
                </div>
              </div>
            )
          })}
          {!live && loading && (
            <div className="col-span-full py-8 text-center text-sm text-flow-muted">Loading sector ETFs from Yahoo…</div>
          )}
        </div>
      </div>
    </section>
  )
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  delta,
  hint,
  invertColors,
  badge,
}: {
  icon: ReactNode
  label: string
  value: string
  subValue?: string
  delta?: number
  hint: string
  invertColors?: boolean
  badge?: ReactNode
}) {
  const positive = (delta ?? 0) >= 0
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight
  const deltaTone =
    delta === undefined
      ? ''
      : invertColors
        ? positive
          ? 'text-flow-red'
          : 'text-flow-green'
        : signedClass(delta)

  return (
    <article className="rounded-2xl border border-flow-border bg-flow-panel/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-flow-muted">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
            {icon}
          </span>
          {label}
        </span>
        <span className="inline-flex items-center gap-2">
          {badge}
          {delta !== undefined && (
            <span className={`inline-flex items-center font-mono text-xs ${deltaTone}`}>
              <DeltaIcon className="h-3.5 w-3.5" />
              {formatPct(delta)}
            </span>
          )}
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tracking-tight text-white">{value}</div>
      {subValue && <div className="mt-1 font-mono text-sm text-flow-green">{subValue}</div>}
      <p className="mt-2 text-[11px] text-flow-muted">{hint}</p>
    </article>
  )
}
