import { ExternalLink, Landmark, Search } from 'lucide-react'
import { useState } from 'react'
import { useCapitolTrades } from '../hooks/useCapitolTrades'
import { LiveBadge } from './SampleBadge'

export function CapitolTracker() {
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<'pelosi' | 'all'>('pelosi')
  const { filtered, pelosi, loading, error, rows } = useCapitolTrades(query)
  const list = focus === 'pelosi' && !query.trim() ? pelosi : filtered.slice(0, 40)

  return (
    <section className="rounded-2xl border border-flow-border bg-flow-panel/80 p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Landmark className="h-4 w-4 text-violet-300" />
            <h2 className="font-display text-lg font-semibold text-white">Capitol Tracker</h2>
            <LiveBadge label="House Clerk" />
          </div>
          <p className="mt-1 text-xs text-flow-muted">
            Official U.S. House Periodic Transaction Reports (STOCK Act). House Stock Watcher S3 and Quiver/FMP
            demo keys are blocked or paid — this feed needs no API key. Tickers and dollar ranges live inside each PTR
            PDF.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-flow-border bg-[#0c1220] p-1">
            <button
              type="button"
              onClick={() => {
                setFocus('pelosi')
                setQuery('')
              }}
              className={`rounded-lg px-2.5 py-1 text-[11px] ${
                focus === 'pelosi' && !query
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-flow-muted hover:text-white'
              }`}
            >
              Pelosi
            </button>
            <button
              type="button"
              onClick={() => setFocus('all')}
              className={`rounded-lg px-2.5 py-1 text-[11px] ${
                focus === 'all' || query
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-flow-muted hover:text-white'
              }`}
            >
              All House PTRs
            </button>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flow-muted" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setFocus('all')
          }}
          placeholder="Search member name or district — Pelosi, Moskowitz, CA11…"
          className="w-full rounded-xl border border-flow-border bg-[#0c1220] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-flow-muted/70 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {loading && <p className="py-6 text-center text-sm text-flow-muted">Loading House Clerk disclosure index…</p>}
      {error && <p className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">{error}</p>}

      {!loading && focus === 'pelosi' && !query && (
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {pelosi.slice(0, 3).map((filing) => (
            <article key={filing.id} className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-violet-200">Nancy Pelosi · PTR</p>
              <p className="mt-2 font-display text-lg text-white">{filing.filingDate}</p>
              <p className="mt-1 text-xs text-flow-muted">
                CA-11 disclosure · Doc {filing.docId} · {filing.efiled ? 'e-filed PDF' : 'scanned PDF'}
              </p>
              <a
                href={filing.officialPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white"
              >
                Open official PTR <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
          {pelosi.length === 0 && (
            <p className="col-span-full text-sm text-flow-muted">No Pelosi Periodic Transaction Reports in the loaded years.</p>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-flow-border text-[11px] uppercase tracking-wider text-flow-muted">
              <th className="px-3 py-2 font-medium">Member</th>
              <th className="px-3 py-2 font-medium">District</th>
              <th className="px-3 py-2 font-medium">Filed</th>
              <th className="px-3 py-2 font-medium">Doc ID</th>
              <th className="px-3 py-2 font-medium">Format</th>
              <th className="px-3 py-2 font-medium text-center">PTR</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-flow-border/70 transition hover:bg-white/[0.035]">
                <td className="px-3 py-2.5 font-medium text-white">{row.name.replace(/^Hon\.\s/, '')}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-flow-muted">{row.district}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-200">{row.filingDate}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-flow-muted">{row.docId}</td>
                <td className="px-3 py-2.5 text-xs text-flow-muted">{row.efiled ? 'E-file' : 'Scan'}</td>
                <td className="px-3 py-2.5 text-center">
                  <a
                    href={row.officialPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-md p-1.5 text-indigo-300 hover:bg-indigo-500/10"
                    aria-label={`PTR PDF for ${row.name}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && list.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-flow-muted">No matching House PTRs.</p>
        )}
      </div>
      <p className="mt-3 text-[11px] text-flow-muted">
        {rows.length} House PTRs loaded from the Clerk year index. This is the disclosure date, not the trade date.
        Amounts and tickers are in the PDF (members have 30–45 days to file).
      </p>
    </section>
  )
}
