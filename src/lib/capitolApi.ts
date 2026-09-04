import JSZip from 'jszip'

export type HousePtrFiling = {
  id: string
  prefix: string
  last: string
  first: string
  suffix: string
  name: string
  filingType: string
  district: string
  year: string
  filingDate: string
  filingDateMs: number
  docId: string
  pdfUrl: string
  officialPdfUrl: string
  efiled: boolean
}

const CURRENT_YEAR = new Date().getFullYear()

export async function fetchHousePtrIndex(years: number[] = [CURRENT_YEAR, CURRENT_YEAR - 1]): Promise<HousePtrFiling[]> {
  const batches = await Promise.all(years.map((year) => loadYear(year)))
  const all = batches.flat()
  all.sort((a, b) => b.filingDateMs - a.filingDateMs)
  return all
}

async function loadYear(year: number): Promise<HousePtrFiling[]> {
  const res = await fetch(`/api/clerk/public_disc/financial-pdfs/${year}FD.ZIP`)
  if (!res.ok) return []
  const zip = await JSZip.loadAsync(await res.arrayBuffer())
  const txtFile = zip.file(`${year}FD.txt`)
  if (!txtFile) return []
  const text = await txtFile.async('string')
  return parseClerkTsv(text, year)
}

function parseClerkTsv(text: string, year: number): HousePtrFiling[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []
  const header = lines[0]!.split('\t').map((cell) => cell.trim())
  const idx = Object.fromEntries(header.map((name, i) => [name, i]))

  const rows: HousePtrFiling[] = []
  for (const line of lines.slice(1)) {
    const cols = line.split('\t')
    const filingType = (cols[idx.FilingType] ?? '').trim()
    if (filingType !== 'P') continue
    const docId = (cols[idx.DocID] ?? '').trim()
    const filingDate = (cols[idx.FilingDate] ?? '').trim()
    const first = (cols[idx.First] ?? '').trim()
    const last = (cols[idx.Last] ?? '').trim()
    const prefix = (cols[idx.Prefix] ?? '').trim()
    const suffix = (cols[idx.Suffix] ?? '').trim()
    const district = (cols[idx.StateDst] ?? '').trim()
    const y = (cols[idx.Year] ?? String(year)).trim()
    rows.push({
      id: `${y}-${docId}`,
      prefix,
      last,
      first,
      suffix,
      name: [prefix, first, last, suffix].filter(Boolean).join(' ').replace(/^Hon\.\s*/i, 'Hon. '),
      filingType,
      district,
      year: y,
      filingDate,
      filingDateMs: parseClerkDate(filingDate),
      docId,
      pdfUrl: `/api/clerk/public_disc/ptr-pdfs/${y}/${docId}.pdf`,
      officialPdfUrl: `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${y}/${docId}.pdf`,
      efiled: docId.length === 8 && docId.startsWith('2'),
    })
  }
  return rows
}

function parseClerkDate(value: string): number {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return 0
  return Date.UTC(Number(match[3]), Number(match[1]) - 1, Number(match[2]))
}

export function searchHouseFilings(rows: HousePtrFiling[], query: string): HousePtrFiling[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => {
    const hay = `${row.name} ${row.last} ${row.first} ${row.district} ${row.docId}`.toLowerCase()
    return hay.includes(q)
  })
}
