import { CIK_BY_SYMBOL } from '../data/ciks'
import type { InsiderTrade, TimeRange, TradeAction } from '../data/mockData'

const FMP_KEY = import.meta.env.VITE_FMP_API_KEY || 'demo'

export type LiveQuote = {
  symbol: string
  price: number
  changePct: number
  previousClose: number
  sparkline: number[]
}

export type DataSource = 'sec' | 'fmp' | 'mock'

export type FmpFetchResult = {
  raw: unknown
  rows: InsiderTrade[]
  error?: string
}

const YAHOO_RANGE: Record<TimeRange, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '1W': { range: '5d', interval: '1d' },
  '1M': { range: '1mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1wk' },
}

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string
        regularMarketPrice?: number
        previousClose?: number
        chartPreviousClose?: number
      }
      indicators?: { quote?: Array<{ close?: Array<number | null> }> }
    }>
    error?: { description?: string } | null
  }
}

type SecSubmissions = {
  cik?: string
  name?: string
  filings?: {
    recent?: {
      form?: string[]
      accessionNumber?: string[]
      filingDate?: string[]
      primaryDocument?: string[]
    }
  }
}

type CompanyTickerRow = { cik_str: number; ticker: string; title: string }

let tickerCikCache: Record<string, string> | null = null

export async function fetchYahooQuote(symbol: string, timeRange: TimeRange): Promise<LiveQuote> {
  const { range, interval } = YAHOO_RANGE[timeRange]
  const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`
  const json = (await getJson(url)) as YahooChart
  const result = json.chart?.result?.[0]
  if (!result?.meta?.regularMarketPrice) {
    throw new Error(json.chart?.error?.description || `No Yahoo chart data for ${symbol}`)
  }

  const price = result.meta.regularMarketPrice
  const previousClose = result.meta.previousClose ?? result.meta.chartPreviousClose ?? price
  const closes = (result.indicators?.quote?.[0]?.close ?? []).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  )
  const sampled = sampleCloses(closes, 24)
  const changePct = previousClose ? ((price - previousClose) / previousClose) * 100 : 0

  return {
    symbol: result.meta.symbol ?? symbol,
    price,
    changePct,
    previousClose,
    sparkline: sampled,
  }
}

export async function fetchFmpInsiders(symbol: string): Promise<FmpFetchResult> {
  const url = `/api/fmp/api/v4/insider-trading?symbol=${encodeURIComponent(symbol)}&page=0&apikey=${encodeURIComponent(FMP_KEY)}`
  const raw = await getJson(url)
  console.log(`FMP insider-trading (${symbol}):`, raw)

  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'Error Message' in raw) {
    return {
      raw,
      rows: [],
      error: String((raw as { 'Error Message': string })['Error Message']),
    }
  }

  if (!Array.isArray(raw)) {
    return { raw, rows: [], error: 'FMP returned an unexpected payload (expected an array).' }
  }

  return { raw, rows: raw.map(mapFmpRow).filter((row) => row.shares > 0 || row.value > 0) }
}

export async function fetchSecInsiders(symbol: string, limit = 8): Promise<InsiderTrade[]> {
  const cik = await resolveCik(symbol)
  if (!cik) throw new Error(`No SEC CIK mapped for ${symbol}`)

  const submissions = (await getJson(
    `/api/sec/submissions/CIK${cik}.json`,
  )) as SecSubmissions
  const recent = submissions.filings?.recent
  if (!recent?.form) throw new Error('SEC submissions payload was missing filings.recent')

  const form4: Array<{ accession: string; date: string; primary: string }> = []
  for (let i = 0; i < recent.form.length && form4.length < limit; i++) {
    if (recent.form[i] === '4') {
      form4.push({
        accession: recent.accessionNumber?.[i] ?? '',
        date: recent.filingDate?.[i] ?? '',
        primary: recent.primaryDocument?.[i] ?? '',
      })
    }
  }

  const rows: InsiderTrade[] = []
  for (const filing of form4) {
    const xmlName = filing.primary.split('/').pop() || filing.primary
    if (!xmlName.toLowerCase().endsWith('.xml')) continue
    const accDir = filing.accession.replace(/-/g, '')
    const numericCik = String(Number(cik))
    const xmlUrl = `/api/edgar/Archives/edgar/data/${numericCik}/${accDir}/${xmlName}`
    const filingUrl = `https://www.sec.gov/Archives/edgar/data/${numericCik}/${accDir}/${xmlName}`
    try {
      const xml = await getText(xmlUrl)
      rows.push(...parseForm4Xml(xml, filingUrl))
    } catch (err) {
      console.warn('Form 4 XML fetch failed', xmlUrl, err)
    }
  }

  return rows.slice(0, 24)
}

async function resolveCik(symbol: string): Promise<string | null> {
  const known = CIK_BY_SYMBOL[symbol.toUpperCase()]
  if (known) return known
  if (!tickerCikCache) {
    const payload = (await getJson('/api/edgar/files/company_tickers.json')) as Record<
      string,
      CompanyTickerRow
    >
    tickerCikCache = {}
    for (const row of Object.values(payload)) {
      tickerCikCache[row.ticker.toUpperCase()] = String(row.cik_str).padStart(10, '0')
    }
  }
  return tickerCikCache[symbol.toUpperCase()] ?? null
}

function parseForm4Xml(xml: string, filingUrl: string): InsiderTrade[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) return []

  const name = formatInsiderName(text(doc, 'rptOwnerName') || 'Unknown insider')
  const title = ownerTitle(doc)
  const rows: InsiderTrade[] = []

  const nodes = [
    ...doc.querySelectorAll('nonDerivativeTransaction'),
    ...doc.querySelectorAll('derivativeTransaction'),
  ]

  nodes.forEach((node, index) => {
    const code = text(node, 'transactionCode')
    const acquired = text(node, 'transactionAcquiredDisposedCode')
    const shares = Number(text(node, 'transactionShares value') || text(node, 'transactionShares') || 0)
    const price = Number(
      text(node, 'transactionPricePerShare value') || text(node, 'transactionPricePerShare') || 0,
    )
    const date = text(node, 'transactionDate value') || text(node, 'transactionDate') || text(doc, 'periodOfReport')
    const action = mapTxnCode(code, acquired)
    if (!shares && !price) return
    rows.push({
      id: `${filingUrl}-${index}`,
      name,
      title,
      action,
      shares,
      value: shares * price,
      date,
      filingUrl,
    })
  })

  return rows
}

function mapTxnCode(code: string, acquiredDisposed: string): TradeAction {
  const c = code.toUpperCase()
  if (c === 'P') return 'Buy'
  if (c === 'S') return 'Sell'
  if (c === 'M') return 'Option Exercise'
  if (c === 'G') return 'Gift'
  if (c === 'A') return 'Award'
  if (c === 'F') return 'Tax'
  if (acquiredDisposed === 'A') return 'Buy'
  if (acquiredDisposed === 'D') return 'Sell'
  return 'Other'
}

function ownerTitle(doc: Document): string {
  const officerTitle = text(doc, 'officerTitle')
  if (officerTitle) return officerTitle
  if (text(doc, 'isOfficer') === '1') return 'Officer'
  if (text(doc, 'isDirector') === '1') return 'Director'
  if (text(doc, 'isTenPercentOwner') === '1') return '10% Owner'
  return 'Insider'
}

function formatInsiderName(name: string): string {
  const cleaned = name.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
  const parts = cleaned.split(' ')
  if (parts.length >= 2 && parts.every((part) => part === part.toUpperCase())) {
    const [last, ...rest] = parts
    return [...rest, last].map(titleCase).join(' ')
  }
  return cleaned
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function text(root: ParentNode, selector: string): string {
  return root.querySelector(selector)?.textContent?.trim() ?? ''
}

function mapFmpRow(entry: unknown, index: number): InsiderTrade {
  const row = entry as Record<string, unknown>
  const type = String(row.transactionType ?? row.type ?? '')
  const acquired = String(row.acquistionOrDisposition ?? row.acquisitionOrDisposition ?? '')
  const shares = Number(row.securitiesTransacted ?? row.shares ?? 0)
  const price = Number(row.price ?? 0)
  return {
    id: String(row.link ?? row.filingDate ?? index) + String(index),
    name: String(row.reportingName ?? row.reporterName ?? 'Unknown insider'),
    title: String(row.typeOfOwner ?? row.reportingOwnerTitle ?? 'Insider'),
    action: mapFmpAction(type, acquired),
    shares,
    value: shares * price,
    date: String(row.transactionDate ?? row.filingDate ?? ''),
    filingUrl: String(row.link ?? 'https://www.sec.gov/'),
  }
}

function mapFmpAction(type: string, acquired: string): TradeAction {
  const t = type.toLowerCase()
  if (t.includes('purchase') || t.startsWith('p-')) return 'Buy'
  if (t.includes('sale') || t.startsWith('s-')) return 'Sell'
  if (t.includes('option') || t.includes('exercise') || t.startsWith('m-')) return 'Option Exercise'
  if (t.includes('gift')) return 'Gift'
  if (t.includes('award')) return 'Award'
  return mapTxnCode(type.split('-')[0] ?? '', acquired)
}

function sampleCloses(values: number[], count: number): number[] {
  if (values.length <= count) return values
  const step = (values.length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => values[Math.round(i * step)]!)
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} failed (${res.status})`)
  return res.json()
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} failed (${res.status})`)
  return res.text()
}
