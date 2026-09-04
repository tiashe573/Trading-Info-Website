import { ArrowDownRight, ArrowUpRight, Building2, Cpu, Landmark } from 'lucide-react'
import type { ReactNode } from 'react'
import { MACRO_BY_RANGE, SECTOR_HEATMAP, type TimeRange } from '../data/mockData'
import { formatPct, formatUSD, signedClass } from '../lib/format'
import { SampleBadge } from './SampleBadge'

type MacroOverviewProps = {
  timeRange: TimeRange
}

export function MacroOverview({ timeRange }: MacroOverviewProps) {
  const macro = MACRO_BY_RANGE[timeRange]
  const sectors = SECTOR_HEATMAP[timeRange]
  const maxAbs = Math.max(...sectors.map((s) => Math.abs(s.netFlow)))

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-white">Market-wide flow</h2>
            <SampleBadge />
          </div>
          <p className="text-xs text-flow-muted">
            Macro view · U.S. equities · {timeRange} net institutional & insider activity
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          icon={<Landmark className="h-4 w-4" />}
          label="Institutional net inflow"
          value={formatUSD(macro.institutionalNetInflow)}
          delta={macro.institutionalDeltaPct}
          hint="13F + 13D/G inferred prints"
        />
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          label="SEC Form 4 insider net"
          value={formatUSD(macro.insiderNet)}
          delta={macro.insiderDeltaPct}
          hint="Open-market buys minus sales"
          invertColors
        />
        <StatCard
          icon={<Cpu className="h-4 w-4" />}
          label="Top inflow sector"
          value={macro.topInflowSector}
          subValue={formatUSD(macro.topInflowAmount)}
          hint={`${timeRange} leadership`}
        />
      </div>

      <div className="rounded-2xl border border-flow-border bg-flow-panel/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-white">Sector flow heatmap</h3>
              <SampleBadge />
            </div>
            <p className="text-[11px] text-flow-muted">Net buying (green) vs. net selling (red)</p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-flow-muted">
            <span className="h-2 w-8 rounded-full bg-gradient-to-r from-flow-red to-slate-700" />
            Sell
            <span className="h-2 w-8 rounded-full bg-gradient-to-r from-slate-700 to-flow-green" />
            Buy
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {sectors.map((sector) => {
            const intensity = Math.abs(sector.netFlow) / maxAbs
            const buy = sector.netFlow >= 0
            const bg = buy
              ? `rgba(34, 211, 166, ${0.08 + intensity * 0.38})`
              : `rgba(244, 63, 94, ${0.08 + intensity * 0.38})`
            const glow = buy ? '0 0 18px rgba(34, 211, 166, 0.12)' : '0 0 18px rgba(244, 63, 94, 0.12)'
            return (
              <div
                key={sector.name}
                className="rounded-xl border border-white/5 p-3 transition hover:border-white/15"
                style={{ background: bg, boxShadow: intensity > 0.7 ? glow : undefined }}
              >
                <div className="text-[11px] font-medium text-slate-200">{sector.name}</div>
                <div className={`mt-2 font-mono text-sm font-semibold ${signedClass(sector.netFlow)}`}>
                  {sector.netFlow >= 0 ? '+' : ''}
                  {formatUSD(sector.netFlow)}
                </div>
                <div className={`mt-1 font-mono text-[11px] ${signedClass(sector.changePct)}`}>
                  {formatPct(sector.changePct)} vs prior
                </div>
              </div>
            )
          })}
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
}: {
  icon: ReactNode
  label: string
  value: string
  subValue?: string
  delta?: number
  hint: string
  invertColors?: boolean
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
        {delta !== undefined && (
          <span className={`inline-flex items-center font-mono text-xs ${deltaTone}`}>
            <DeltaIcon className="h-3.5 w-3.5" />
            {formatPct(delta)}
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tracking-tight text-white">{value}</div>
      {subValue && <div className="mt-1 font-mono text-sm text-flow-green">{subValue}</div>}
      <p className="mt-2 text-[11px] text-flow-muted">{hint}</p>
    </article>
  )
}
