import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ensureCompanyDirectory,
  searchCompanies,
  type CompanyRecord,
} from '../lib/marketApi'

type CompanySearchProps = {
  onSelect: (company: CompanyRecord) => void
  placeholder?: string
}

export function CompanySearch({
  onSelect,
  placeholder = 'Search company name or ticker — NVIDIA, Apple, NVDA…',
}: CompanySearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void ensureCompanyDirectory().then(() => setReady(true))
  }, [])

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const suggestions = useMemo(() => (ready ? searchCompanies(query, 8) : []), [query, ready])

  return (
    <div className="relative" ref={rootRef}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flow-muted" />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-flow-border bg-[#0c1220] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-flow-muted/70 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
      />
      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-flow-border bg-[#0c1220] shadow-2xl shadow-black/50">
          <div className="border-b border-flow-border px-3 py-2 text-[11px] uppercase tracking-wider text-flow-muted">
            {ready ? 'SEC company directory' : 'Loading company list…'}
          </div>
          {ready && suggestions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-flow-muted">No matching companies.</div>
          ) : (
            suggestions.map((company) => (
              <button
                key={`${company.cik}-${company.ticker}`}
                type="button"
                onClick={() => {
                  onSelect(company)
                  setQuery(company.ticker)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-white/5"
              >
                <span className="min-w-0 truncate text-sm text-slate-200">{company.name}</span>
                <span className="shrink-0 font-mono text-xs text-indigo-200">{company.ticker}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
