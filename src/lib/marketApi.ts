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

type YahooQuoteSeries = {
  close?: Array<number | null>
  open?: Array<number | null>
  high?: Array<number | null>
  low?: Array<number | null>
  volume?: Array<number | null>
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
      indicators?: { quote?: YahooQuoteSeries[] }
    }>
    error?: { description?: string } | null
  }
}

export type SectorEtfSnapshot = {
  symbol: string
  changePct: number
  price: number
  flowProxy: number
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

export type CompanyRecord = {
  ticker: string
  name: string
  cik: string
}

export type InsiderPoolRow = {
  ticker: string
  name: string
  cik: string
  buyValue: number
  sellValue: number
  buyShares: number
  sellShares: number
  filings: number
  netValue: number
  grossValue: number
}

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

export async function fetchYahooSectorSnapshot(
  symbol: string,
  timeRange: TimeRange,
): Promise<SectorEtfSnapshot> {
  const { range, interval } = YAHOO_RANGE[timeRange]
  const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`
  const json = (await getJson(url)) as YahooChart
  const result = json.chart?.result?.[0]
  const series = result?.indicators?.quote?.[0]
  const price = result?.meta?.regularMarketPrice
  if (!result || !series || !price) {
    throw new Error(json.chart?.error?.description || `No Yahoo sector data for ${symbol}`)
  }

  const previousClose = result.meta?.previousClose ?? result.meta?.chartPreviousClose ?? price
  const changePct = previousClose ? ((price - previousClose) / previousClose) * 100 : 0
  const length = Math.max(
    series.close?.length ?? 0,
    series.open?.length ?? 0,
    series.high?.length ?? 0,
    series.low?.length ?? 0,
    series.volume?.length ?? 0,
  )

  let flowProxy = 0
  for (let i = 0; i < length; i++) {
    const open = series.open?.[i]
    const high = series.high?.[i]
    const low = series.low?.[i]
    const close = series.close?.[i]
    const volume = series.volume?.[i]
    if (
      open == null ||
      high == null ||
      low == null ||
      close == null ||
      volume == null ||
      !Number.isFinite(volume)
    ) {
      continue
    }
    const typicalPrice = (high + low + close) / 3
    const direction = close > open ? 1 : close < open ? -1 : 0
    flowProxy += typicalPrice * volume * direction
  }

  return { symbol, changePct, price, flowProxy }
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

export type SecInsiderPage = {
  rows: InsiderTrade[]
  nextOffset: number
  totalForm4: number
  fetchedFilings: number
  hasMore: boolean
}

const submissionsCache = new Map<string, SecSubmissions>()

export async function fetchSecInsiders(
  symbol: string,
  options: { offset?: number; filingCount?: number } = {},
): Promise<SecInsiderPage> {
  const offset = options.offset ?? 0
  const filingCount = options.filingCount ?? 25
  const cik = await resolveCik(symbol)
  if (!cik) throw new Error(`No SEC CIK mapped for ${symbol}`)

  let submissions = submissionsCache.get(cik)
  if (!submissions) {
    submissions = (await getJson(`/api/sec/submissions/CIK${cik}.json`)) as SecSubmissions
    submissionsCache.set(cik, submissions)
  }
  const recent = submissions.filings?.recent
  if (!recent?.form) throw new Error('SEC submissions payload was missing filings.recent')

  const allForm4: Array<{ accession: string; date: string; primary: string }> = []
  for (let i = 0; i < recent.form.length; i++) {
    if (recent.form[i] === '4' || recent.form[i] === '4/A') {
      allForm4.push({
        accession: recent.accessionNumber?.[i] ?? '',
        date: recent.filingDate?.[i] ?? '',
        primary: recent.primaryDocument?.[i] ?? '',
      })
    }
  }

  const batch = allForm4.slice(offset, offset + filingCount)
  const rows: InsiderTrade[] = []
  for (const filing of batch) {
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
    await sleep(40)
  }

  const nextOffset = offset + batch.length
  return {
    rows,
    nextOffset,
    totalForm4: allForm4.length,
    fetchedFilings: batch.length,
    hasMore: nextOffset < allForm4.length,
  }
}

let companyDirectory: CompanyRecord[] | null = null
const tickerCikCache: Record<string, string> = { ...CIK_BY_SYMBOL }
const cikCompanyCache: Record<string, CompanyRecord> = {}

export async function ensureCompanyDirectory(): Promise<CompanyRecord[]> {
  if (companyDirectory) return companyDirectory
  const payload = (await getJson('/api/edgar/files/company_tickers.json')) as Record<
    string,
    { cik_str: number; ticker: string; title: string }
  >
  companyDirectory = Object.values(payload).map((row) => {
    const record: CompanyRecord = {
      ticker: row.ticker.toUpperCase(),
      name: row.title,
      cik: String(row.cik_str).padStart(10, '0'),
    }
    tickerCikCache[record.ticker] = record.cik
    cikCompanyCache[record.cik] = record
    cikCompanyCache[String(row.cik_str)] = record
    return record
  })
  return companyDirectory
}

export function searchCompanies(query: string, limit = 8): CompanyRecord[] {
  const list = companyDirectory ?? []
  const q = query.trim().toLowerCase()
  if (!q) return list.slice(0, limit)
  const starts: CompanyRecord[] = []
  const contains: CompanyRecord[] = []
  for (const row of list) {
    const ticker = row.ticker.toLowerCase()
    const name = row.name.toLowerCase()
    if (ticker === q || ticker.startsWith(q) || name.startsWith(q)) starts.push(row)
    else if (ticker.includes(q) || name.includes(q)) contains.push(row)
    if (starts.length >= limit) break
  }
  return [...starts, ...contains].slice(0, limit)
}

export async function fetchInsiderVolumePool(limit = 24): Promise<InsiderPoolRow[]> {
  await ensureCompanyDirectory()
  const atom = await getText(
    '/api/edgar/cgi-bin/browse-edgar?action=getcurrent&type=4&owner=include&count=100&output=atom',
  )
  const doc = new DOMParser().parseFromString(atom, 'application/xml')
  const filings: Array<{ name: string; cik: string; indexUrl: string }> = []
  const seen = new Set<string>()

  for (const entry of Array.from(doc.getElementsByTagName('entry'))) {
    const title = entry.getElementsByTagName('title')[0]?.textContent ?? ''
    const match = title.match(/^4(?:\/A)?\s*-\s*(.+?)\s*\((\d+)\)\s*\(Issuer\)\s*$/)
    if (!match) continue
    const summary = entry.getElementsByTagName('summary')[0]?.textContent ?? ''
    const accession = summary.match(/AccNo:\s*([0-9-]+)/i)?.[1]
    const href = entry.getElementsByTagName('link')[0]?.getAttribute('href') ?? ''
    if (!accession || !href || seen.has(accession)) continue
    seen.add(accession)
    filings.push({
      name: match[1].trim(),
      cik: match[2].padStart(10, '0'),
      indexUrl: toEdgarProxy(href),
    })
    if (filings.length >= limit) break
  }

  const totals = new Map<string, InsiderPoolRow>()

  for (const filing of filings) {
    try {
      const indexHtml = await getText(filing.indexUrl)
      const xmlHref = findForm4XmlHref(indexHtml)
      if (!xmlHref) continue
      const xml = await getText(toEdgarProxy(xmlHref))
      const parsed = parseForm4Document(xml, xmlHref.startsWith('http') ? xmlHref : `https://www.sec.gov${xmlHref}`)
      const ticker =
        parsed.issuerSymbol ||
        cikCompanyCache[parsed.issuerCik]?.ticker ||
        cikCompanyCache[filing.cik]?.ticker ||
        ''
      if (!ticker) continue
      const key = ticker.toUpperCase()
      const current = totals.get(key) ?? {
        ticker: key,
        name: parsed.issuerName || filing.name || cikCompanyCache[filing.cik]?.name || key,
        cik: parsed.issuerCik || filing.cik,
        buyValue: 0,
        sellValue: 0,
        buyShares: 0,
        sellShares: 0,
        filings: 0,
        netValue: 0,
        grossValue: 0,
      }
      current.filings += 1
      for (const row of parsed.rows) {
        if (row.action === 'Buy') {
          current.buyValue += row.value
          current.buyShares += row.shares
        }
        if (row.action === 'Sell') {
          current.sellValue += row.value
          current.sellShares += row.shares
        }
      }
      current.netValue = current.buyValue - current.sellValue
      current.grossValue = current.buyValue + current.sellValue
      totals.set(key, current)
    } catch (err) {
      console.warn('Insider pool filing failed', filing.indexUrl, err)
    }
    await sleep(60)
  }

  return [...totals.values()].sort((a, b) => b.grossValue - a.grossValue || b.filings - a.filings)
}

function findForm4XmlHref(indexHtml: string): string | null {
  const hrefs = [...indexHtml.matchAll(/href="([^"]+\.xml)"/gi)].map((match) => match[1] ?? '')
  return hrefs.find((href) => href && !href.toLowerCase().includes('xsl')) ?? hrefs[0] ?? null
}

function toEdgarProxy(url: string): string {
  if (url.startsWith('/api/edgar')) return url
  if (url.startsWith('https://www.sec.gov')) return `/api/edgar${url.slice('https://www.sec.gov'.length)}`
  if (url.startsWith('http://www.sec.gov')) return `/api/edgar${url.slice('http://www.sec.gov'.length)}`
  if (url.startsWith('/')) return `/api/edgar${url}`
  return url
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function resolveCik(symbol: string): Promise<string | null> {
  const known = tickerCikCache[symbol.toUpperCase()] ?? CIK_BY_SYMBOL[symbol.toUpperCase()]
  if (known) return known
  await ensureCompanyDirectory()
  return tickerCikCache[symbol.toUpperCase()] ?? null
}

function parseForm4Xml(xml: string, filingUrl: string): InsiderTrade[] {
  return parseForm4Document(xml, filingUrl).rows
}

function parseForm4Document(xml: string, filingUrl: string): {
  issuerSymbol: string
  issuerName: string
  issuerCik: string
  rows: InsiderTrade[]
} {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) {
    return { issuerSymbol: '', issuerName: '', issuerCik: '', rows: [] }
  }

  const issuerSymbol = text(doc, 'issuerTradingSymbol').toUpperCase()
  const issuerName = text(doc, 'issuerName')
  const issuerCik = text(doc, 'issuerCik').padStart(10, '0')
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

  return { issuerSymbol, issuerName, issuerCik, rows }
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
