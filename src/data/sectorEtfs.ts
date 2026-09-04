export const SECTOR_ETFS = [
  { name: 'Semiconductors', symbol: 'SMH' },
  { name: 'Technology', symbol: 'XLK' },
  { name: 'Communication', symbol: 'XLC' },
  { name: 'Financials', symbol: 'XLF' },
  { name: 'Healthcare', symbol: 'XLV' },
  { name: 'Industrials', symbol: 'XLI' },
  { name: 'Energy', symbol: 'XLE' },
  { name: 'Consumer Disc.', symbol: 'XLY' },
  { name: 'Consumer Staples', symbol: 'XLP' },
  { name: 'Utilities', symbol: 'XLU' },
  { name: 'Materials', symbol: 'XLB' },
  { name: 'Real Estate', symbol: 'XLRE' },
] as const

export type SectorHeatmapRow = {
  name: string
  symbol: string
  changePct: number
  flowProxy: number
  price: number
}
