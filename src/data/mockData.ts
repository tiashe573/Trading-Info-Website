export type TimeRange = '1D' | '1W' | '1M' | '1Y'
export type DeepDiveTab = 'insider' | '13f' | 'sweeps' | 'darkpool'
export type TradeAction =
  | 'Buy'
  | 'Sell'
  | 'Option Exercise'
  | 'Gift'
  | 'Award'
  | 'Tax'
  | 'Other'

export type TickerQuote = {
  symbol: string
  name: string
  price: number
  changePct: number
  sector: string
}

export type SectorFlow = {
  name: string
  netFlow: number
  changePct: number
}

export type MacroSnapshot = {
  institutionalNetInflow: number
  institutionalDeltaPct: number
  insiderNet: number
  insiderDeltaPct: number
  topInflowSector: string
  topInflowAmount: number
}

export type InsiderTrade = {
  id: string
  name: string
  title: string
  action: TradeAction
  shares: number
  value: number
  date: string
  filingUrl: string
}

export type FundFlow = {
  fund: string
  aum: string
  shares: number
  changeShares: number
  weightPct: number
  quarter: string
}

export type SweepAlert = {
  id: string
  timeAgo: string
  type: 'call' | 'put'
  sentiment: 'Bullish' | 'Bearish'
  notional: number
  strike: number
  expiry: string
  spot: number
  premium: number
  size: string
}

export type DarkPoolPrint = {
  id: string
  timeAgo: string
  venue: string
  size: number
  notional: number
  price: number
  vsVwapBps: number
  side: 'Buy' | 'Sell' | 'Mixed'
}

export type WhaleAlert = {
  id: string
  timeAgo: string
  headline: string
  detail: string
  notional: number
  sentiment: 'Bullish' | 'Bearish' | 'Neutral'
  kind: 'Dark Pool' | 'Option Sweep' | 'Block'
}

export type StockDeepDive = {
  quote: TickerQuote
  insider: InsiderTrade[]
  funds: FundFlow[]
  sweeps: SweepAlert[]
  darkPool: DarkPoolPrint[]
  whales: WhaleAlert[]
}

export const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '1Y']

export const UNIVERSE: TickerQuote[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 178.42, changePct: 3.2, sector: 'Semiconductors' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 226.18, changePct: 0.8, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 241.66, changePct: -1.5, sector: 'Consumer Discretionary' },
  { symbol: 'BABA', name: 'Alibaba Group', price: 88.14, changePct: 1.1, sector: 'Consumer Discretionary' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 429.05, changePct: 0.6, sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 197.33, changePct: -0.4, sector: 'Consumer Discretionary' },
  { symbol: 'META', name: 'Meta Platforms', price: 582.91, changePct: 2.1, sector: 'Communication Services' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 168.74, changePct: 0.3, sector: 'Communication Services' },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 218.47, changePct: -0.2, sector: 'Financials' },
  { symbol: 'XOM', name: 'Exxon Mobil', price: 116.08, changePct: 1.4, sector: 'Energy' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', price: 174.22, changePct: 2.8, sector: 'Semiconductors' },
  { symbol: 'LLY', name: 'Eli Lilly and Co.', price: 892.4, changePct: -0.9, sector: 'Healthcare' },
]

export const TRENDING_SYMBOLS = ['NVDA', 'TSLA', 'META', 'AVGO', 'AAPL'] as const

export const MACRO_BY_RANGE: Record<TimeRange, MacroSnapshot> = {
  '1D': {
    institutionalNetInflow: 18_400_000_000,
    institutionalDeltaPct: 12.4,
    insiderNet: -412_000_000,
    insiderDeltaPct: -8.1,
    topInflowSector: 'Semiconductors',
    topInflowAmount: 6_800_000_000,
  },
  '1W': {
    institutionalNetInflow: 47_200_000_000,
    institutionalDeltaPct: 4.6,
    insiderNet: -1_860_000_000,
    insiderDeltaPct: -3.2,
    topInflowSector: 'Technology',
    topInflowAmount: 14_100_000_000,
  },
  '1M': {
    institutionalNetInflow: 129_000_000_000,
    institutionalDeltaPct: -1.8,
    insiderNet: -6_240_000_000,
    insiderDeltaPct: 2.4,
    topInflowSector: 'Financials',
    topInflowAmount: 31_500_000_000,
  },
  '1Y': {
    institutionalNetInflow: 812_000_000_000,
    institutionalDeltaPct: 9.7,
    insiderNet: -48_900_000_000,
    insiderDeltaPct: -11.3,
    topInflowSector: 'Technology',
    topInflowAmount: 186_000_000_000,
  },
}

export const SECTOR_HEATMAP: Record<TimeRange, SectorFlow[]> = {
  '1D': [
    { name: 'Semiconductors', netFlow: 6.8e9, changePct: 4.1 },
    { name: 'Technology', netFlow: 3.4e9, changePct: 1.6 },
    { name: 'Communication', netFlow: 2.1e9, changePct: 2.2 },
    { name: 'Financials', netFlow: 1.2e9, changePct: 0.4 },
    { name: 'Healthcare', netFlow: -0.8e9, changePct: -0.7 },
    { name: 'Industrials', netFlow: 0.4e9, changePct: 0.3 },
    { name: 'Energy', netFlow: 0.9e9, changePct: 1.1 },
    { name: 'Consumer Disc.', netFlow: -2.4e9, changePct: -1.9 },
    { name: 'Consumer Staples', netFlow: -0.3e9, changePct: -0.2 },
    { name: 'Utilities', netFlow: -0.5e9, changePct: -0.6 },
    { name: 'Materials', netFlow: 0.2e9, changePct: 0.2 },
    { name: 'Real Estate', netFlow: -1.1e9, changePct: -1.4 },
  ],
  '1W': [
    { name: 'Semiconductors', netFlow: 14.2e9, changePct: 6.4 },
    { name: 'Technology', netFlow: 14.1e9, changePct: 2.8 },
    { name: 'Communication', netFlow: 5.6e9, changePct: 3.1 },
    { name: 'Financials', netFlow: 8.4e9, changePct: 1.2 },
    { name: 'Healthcare', netFlow: -3.1e9, changePct: -1.4 },
    { name: 'Industrials', netFlow: 1.8e9, changePct: 0.9 },
    { name: 'Energy', netFlow: 2.7e9, changePct: 2.0 },
    { name: 'Consumer Disc.', netFlow: -6.8e9, changePct: -2.6 },
    { name: 'Consumer Staples', netFlow: -1.4e9, changePct: -0.5 },
    { name: 'Utilities', netFlow: -0.9e9, changePct: -0.8 },
    { name: 'Materials', netFlow: 0.6e9, changePct: 0.4 },
    { name: 'Real Estate', netFlow: -2.8e9, changePct: -2.1 },
  ],
  '1M': [
    { name: 'Semiconductors', netFlow: 28.5e9, changePct: 9.2 },
    { name: 'Technology', netFlow: 22.0e9, changePct: 3.4 },
    { name: 'Communication', netFlow: 9.8e9, changePct: 4.0 },
    { name: 'Financials', netFlow: 31.5e9, changePct: 2.6 },
    { name: 'Healthcare', netFlow: -12.4e9, changePct: -2.8 },
    { name: 'Industrials', netFlow: 6.1e9, changePct: 1.5 },
    { name: 'Energy', netFlow: 8.9e9, changePct: 3.3 },
    { name: 'Consumer Disc.', netFlow: -18.2e9, changePct: -4.1 },
    { name: 'Consumer Staples', netFlow: -4.6e9, changePct: -1.1 },
    { name: 'Utilities', netFlow: 1.2e9, changePct: 0.4 },
    { name: 'Materials', netFlow: 2.4e9, changePct: 1.0 },
    { name: 'Real Estate', netFlow: -7.3e9, changePct: -3.6 },
  ],
  '1Y': [
    { name: 'Semiconductors', netFlow: 142e9, changePct: 28.4 },
    { name: 'Technology', netFlow: 186e9, changePct: 18.1 },
    { name: 'Communication', netFlow: 61e9, changePct: 14.6 },
    { name: 'Financials', netFlow: 98e9, changePct: 11.2 },
    { name: 'Healthcare', netFlow: -22e9, changePct: -3.4 },
    { name: 'Industrials', netFlow: 41e9, changePct: 8.7 },
    { name: 'Energy', netFlow: 19e9, changePct: 6.1 },
    { name: 'Consumer Disc.', netFlow: -48e9, changePct: -7.9 },
    { name: 'Consumer Staples', netFlow: 6e9, changePct: 1.8 },
    { name: 'Utilities', netFlow: -8e9, changePct: -2.2 },
    { name: 'Materials', netFlow: 11e9, changePct: 4.4 },
    { name: 'Real Estate', netFlow: -31e9, changePct: -9.5 },
  ],
}

function secUrl(accession: string): string {
  return `https://www.sec.gov/Archives/edgar/data/${accession}`
}

const NVDA: StockDeepDive = {
  quote: UNIVERSE[0],
  insider: [
    { id: 'n1', name: 'Jen-Hsun Huang', title: 'CEO', action: 'Sell', shares: 120_000, value: 21_410_400, date: '2026-08-28', filingUrl: secUrl('1045810/000104581026000412') },
    { id: 'n2', name: 'Colette Kress', title: 'CFO', action: 'Option Exercise', shares: 40_000, value: 1_184_000, date: '2026-08-21', filingUrl: secUrl('1045810/000104581026000388') },
    { id: 'n3', name: 'Colette Kress', title: 'CFO', action: 'Sell', shares: 40_000, value: 7_096_800, date: '2026-08-21', filingUrl: secUrl('1045810/000104581026000389') },
    { id: 'n4', name: 'Mark A. Stevens', title: 'Director', action: 'Sell', shares: 85_000, value: 15_165_700, date: '2026-08-14', filingUrl: secUrl('1045810/000104581026000351') },
    { id: 'n5', name: 'Debora Shoquist', title: 'EVP, Operations', action: 'Sell', shares: 18_500, value: 3_265_070, date: '2026-08-07', filingUrl: secUrl('1045810/000104581026000310') },
    { id: 'n6', name: 'A. Brooke Seawell', title: 'Director', action: 'Buy', shares: 2_500, value: 428_550, date: '2026-07-29', filingUrl: secUrl('1045810/000104581026000274') },
    { id: 'n7', name: 'Tench Coxe', title: 'Director', action: 'Sell', shares: 50_000, value: 8_641_000, date: '2026-07-18', filingUrl: secUrl('1045810/000104581026000241') },
  ],
  funds: [
    { fund: 'Vanguard Group', aum: '$9.1T', shares: 221_400_000, changeShares: 8_240_000, weightPct: 8.9, quarter: 'Q2 2026' },
    { fund: 'BlackRock', aum: '$10.6T', shares: 198_750_000, changeShares: 5_110_000, weightPct: 8.0, quarter: 'Q2 2026' },
    { fund: 'State Street', aum: '$4.3T', shares: 96_320_000, changeShares: -2_180_000, weightPct: 3.9, quarter: 'Q2 2026' },
    { fund: 'Fidelity (FMR)', aum: '$5.0T', shares: 62_880_000, changeShares: 4_760_000, weightPct: 2.5, quarter: 'Q2 2026' },
    { fund: 'Capital Group', aum: '$2.6T', shares: 41_200_000, changeShares: 6_900_000, weightPct: 1.7, quarter: 'Q2 2026' },
    { fund: 'Geode Capital', aum: '$1.5T', shares: 38_140_000, changeShares: 1_020_000, weightPct: 1.5, quarter: 'Q2 2026' },
    { fund: 'T. Rowe Price', aum: '$1.6T', shares: 19_450_000, changeShares: -3_640_000, weightPct: 0.8, quarter: 'Q2 2026' },
  ],
  sweeps: [
    { id: 'ns1', timeAgo: '10 mins ago', type: 'call', sentiment: 'Bullish', notional: 18_500_000, strike: 185, expiry: '19 Sep 26', spot: 178.42, premium: 6.4, size: '28,900x' },
    { id: 'ns2', timeAgo: '24 mins ago', type: 'call', sentiment: 'Bullish', notional: 9_200_000, strike: 180, expiry: '05 Sep 26', spot: 178.42, premium: 3.15, size: '14,200x' },
    { id: 'ns3', timeAgo: '1 hr ago', type: 'put', sentiment: 'Bearish', notional: 6_800_000, strike: 170, expiry: '17 Oct 26', spot: 178.42, premium: 4.9, size: '8,750x' },
    { id: 'ns4', timeAgo: '2 hrs ago', type: 'call', sentiment: 'Bullish', notional: 22_100_000, strike: 200, expiry: '18 Dec 26', spot: 178.42, premium: 11.8, size: '12,400x' },
  ],
  darkPool: [
    { id: 'nd1', timeAgo: '4 mins ago', venue: 'UBS ATS', size: 265_400, notional: 47_350_000, price: 178.41, vsVwapBps: 2, side: 'Buy' },
    { id: 'nd2', timeAgo: '18 mins ago', venue: 'MS Pool', size: 148_000, notional: 26_380_000, price: 178.22, vsVwapBps: -6, side: 'Sell' },
    { id: 'nd3', timeAgo: '41 mins ago', venue: 'Crossfinder', size: 92_500, notional: 16_510_000, price: 178.48, vsVwapBps: 8, side: 'Buy' },
    { id: 'nd4', timeAgo: '1 hr ago', venue: 'Level ATS', size: 410_000, notional: 73_050_000, price: 178.17, vsVwapBps: -11, side: 'Mixed' },
  ],
  whales: [
    { id: 'nw1', timeAgo: '10 mins ago', headline: '$18.5M Bullish Call Sweep', detail: 'NVDA 185C 19Sep — 28,900 contracts, 92% ask-side', notional: 18_500_000, sentiment: 'Bullish', kind: 'Option Sweep' },
    { id: 'nw2', timeAgo: '4 mins ago', headline: '$47.4M Dark Pool Print', detail: 'UBS ATS lifted 265k shares at $178.41', notional: 47_350_000, sentiment: 'Bullish', kind: 'Dark Pool' },
    { id: 'nw3', timeAgo: '18 mins ago', headline: '$26.4M Block Sale', detail: 'Morgan Stanley Pool, 6 bps below VWAP', notional: 26_380_000, sentiment: 'Bearish', kind: 'Block' },
    { id: 'nw4', timeAgo: '2 hrs ago', headline: '$22.1M LEAP Call Sweep', detail: 'Dec 200C — unusual size vs OI of 8.1k', notional: 22_100_000, sentiment: 'Bullish', kind: 'Option Sweep' },
  ],
}

const AAPL: StockDeepDive = {
  quote: UNIVERSE[1],
  insider: [
    { id: 'a1', name: 'Timothy D. Cook', title: 'CEO', action: 'Sell', shares: 98_066, value: 22_180_000, date: '2026-08-15', filingUrl: secUrl('320193/000032019326000188') },
    { id: 'a2', name: 'Kevan Parekh', title: 'CFO', action: 'Option Exercise', shares: 22_410, value: 1_642_000, date: '2026-08-08', filingUrl: secUrl('320193/000032019326000171') },
    { id: 'a3', name: 'Kevan Parekh', title: 'CFO', action: 'Sell', shares: 12_000, value: 2_710_000, date: '2026-08-08', filingUrl: secUrl('320193/000032019326000172') },
    { id: 'a4', name: 'Deirdre O’Brien', title: 'SVP, Retail', action: 'Sell', shares: 31_250, value: 7_045_000, date: '2026-07-31', filingUrl: secUrl('320193/000032019326000154') },
    { id: 'a5', name: 'Arthur D. Levinson', title: 'Chairman', action: 'Buy', shares: 8_000, value: 1_784_000, date: '2026-07-22', filingUrl: secUrl('320193/000032019326000140') },
    { id: 'a6', name: 'Jeff Williams', title: 'COO', action: 'Sell', shares: 44_180, value: 9_920_000, date: '2026-07-09', filingUrl: secUrl('320193/000032019326000121') },
  ],
  funds: [
    { fund: 'Vanguard Group', aum: '$9.1T', shares: 1_342_000_000, changeShares: 11_200_000, weightPct: 8.7, quarter: 'Q2 2026' },
    { fund: 'BlackRock', aum: '$10.6T', shares: 1_108_000_000, changeShares: 6_450_000, weightPct: 7.2, quarter: 'Q2 2026' },
    { fund: 'Berkshire Hathaway', aum: '$1.1T', shares: 300_000_000, changeShares: -15_000_000, weightPct: 1.9, quarter: 'Q2 2026' },
    { fund: 'State Street', aum: '$4.3T', shares: 612_400_000, changeShares: -4_880_000, weightPct: 4.0, quarter: 'Q2 2026' },
    { fund: 'Geode Capital', aum: '$1.5T', shares: 248_100_000, changeShares: 3_020_000, weightPct: 1.6, quarter: 'Q2 2026' },
    { fund: 'FMR LLC', aum: '$5.0T', shares: 189_700_000, changeShares: 8_640_000, weightPct: 1.2, quarter: 'Q2 2026' },
    { fund: 'Norges Bank', aum: '$1.7T', shares: 167_900_000, changeShares: 2_110_000, weightPct: 1.1, quarter: 'Q2 2026' },
  ],
  sweeps: [
    { id: 'as1', timeAgo: '7 mins ago', type: 'call', sentiment: 'Bullish', notional: 11_400_000, strike: 230, expiry: '19 Sep 26', spot: 226.18, premium: 4.2, size: '16,800x' },
    { id: 'as2', timeAgo: '33 mins ago', type: 'put', sentiment: 'Bearish', notional: 8_750_000, strike: 220, expiry: '17 Oct 26', spot: 226.18, premium: 5.1, size: '11,200x' },
    { id: 'as3', timeAgo: '1 hr ago', type: 'call', sentiment: 'Bullish', notional: 15_600_000, strike: 240, expiry: '18 Dec 26', spot: 226.18, premium: 8.9, size: '9,640x' },
  ],
  darkPool: [
    { id: 'ad1', timeAgo: '9 mins ago', venue: 'SIGMA X', size: 420_000, notional: 94_980_000, price: 226.14, vsVwapBps: 1, side: 'Buy' },
    { id: 'ad2', timeAgo: '27 mins ago', venue: 'UBS ATS', size: 188_000, notional: 42_410_000, price: 225.58, vsVwapBps: -14, side: 'Sell' },
    { id: 'ad3', timeAgo: '52 mins ago', venue: 'MS Pool', size: 96_400, notional: 21_820_000, price: 226.35, vsVwapBps: 9, side: 'Buy' },
  ],
  whales: [
    { id: 'aw1', timeAgo: '9 mins ago', headline: '$95.0M Dark Pool Bid', detail: 'Goldman SIGMA X absorbed 420k AAPL at VWAP', notional: 94_980_000, sentiment: 'Bullish', kind: 'Dark Pool' },
    { id: 'aw2', timeAgo: '7 mins ago', headline: '$11.4M Call Sweep', detail: 'AAPL 230C 19Sep — 81% ask-side aggression', notional: 11_400_000, sentiment: 'Bullish', kind: 'Option Sweep' },
    { id: 'aw3', timeAgo: '27 mins ago', headline: '$42.4M Block Distribution', detail: 'UBS ATS, 14 bps through the bid', notional: 42_410_000, sentiment: 'Bearish', kind: 'Block' },
    { id: 'aw4', timeAgo: 'Q2 13F', headline: 'Berkshire trims 15M shares', detail: 'Position still ~300M shares after the cut', notional: 3_390_000_000, sentiment: 'Bearish', kind: 'Block' },
  ],
}

const TSLA: StockDeepDive = {
  quote: UNIVERSE[2],
  insider: [
    { id: 't1', name: 'Elon Musk', title: 'CEO', action: 'Option Exercise', shares: 2_564_000, value: 23_400_000, date: '2026-06-12', filingUrl: secUrl('1318605/000131860526000088') },
    { id: 't2', name: 'Vaibhav Taneja', title: 'CFO', action: 'Sell', shares: 6_412, value: 1_562_000, date: '2026-08-05', filingUrl: secUrl('1318605/000131860526000201') },
    { id: 't3', name: 'Robyn Denholm', title: 'Chair', action: 'Option Exercise', shares: 25_000, value: 1_240_000, date: '2026-07-19', filingUrl: secUrl('1318605/000131860526000176') },
    { id: 't4', name: 'Kimbal Musk', title: 'Director', action: 'Sell', shares: 40_000, value: 9_820_000, date: '2026-07-02', filingUrl: secUrl('1318605/000131860526000155') },
  ],
  funds: [
    { fund: 'Vanguard Group', aum: '$9.1T', shares: 98_400_000, changeShares: -2_240_000, weightPct: 7.1, quarter: 'Q2 2026' },
    { fund: 'BlackRock', aum: '$10.6T', shares: 86_200_000, changeShares: -1_880_000, weightPct: 6.2, quarter: 'Q2 2026' },
    { fund: 'State Street', aum: '$4.3T', shares: 41_050_000, changeShares: -3_100_000, weightPct: 3.0, quarter: 'Q2 2026' },
    { fund: 'Geode Capital', aum: '$1.5T', shares: 18_770_000, changeShares: 420_000, weightPct: 1.4, quarter: 'Q2 2026' },
    { fund: 'Capital Group', aum: '$2.6T', shares: 9_640_000, changeShares: -4_200_000, weightPct: 0.7, quarter: 'Q2 2026' },
  ],
  sweeps: [
    { id: 'ts1', timeAgo: '12 mins ago', type: 'put', sentiment: 'Bearish', notional: 14_200_000, strike: 230, expiry: '19 Sep 26', spot: 241.66, premium: 7.8, size: '12,100x' },
    { id: 'ts2', timeAgo: '38 mins ago', type: 'call', sentiment: 'Bullish', notional: 7_900_000, strike: 250, expiry: '05 Sep 26', spot: 241.66, premium: 4.1, size: '9,850x' },
  ],
  darkPool: [
    { id: 'td1', timeAgo: '6 mins ago', venue: 'SuperX', size: 210_000, notional: 50_620_000, price: 241.05, vsVwapBps: -18, side: 'Sell' },
    { id: 'td2', timeAgo: '29 mins ago', venue: 'Level ATS', size: 74_000, notional: 17_920_000, price: 242.11, vsVwapBps: 12, side: 'Buy' },
  ],
  whales: [
    { id: 'tw1', timeAgo: '12 mins ago', headline: '$14.2M Bearish Put Sweep', detail: 'TSLA 230P 19Sep — 88% bid-side', notional: 14_200_000, sentiment: 'Bearish', kind: 'Option Sweep' },
    { id: 'tw2', timeAgo: '6 mins ago', headline: '$50.6M Dark Pool Hit', detail: 'Citi SuperX, 18 bps below VWAP', notional: 50_620_000, sentiment: 'Bearish', kind: 'Dark Pool' },
    { id: 'tw3', timeAgo: '38 mins ago', headline: '$7.9M Weekly Call Sweep', detail: '250C 05Sep — unusual vs 3.2k OI', notional: 7_900_000, sentiment: 'Bullish', kind: 'Option Sweep' },
  ],
}

function cloneFor(quote: TickerQuote, seed: number): StockDeepDive {
  const scale = quote.price / 180
  return {
    quote,
    insider: NVDA.insider.slice(0, 5).map((row, i) => ({
      ...row,
      id: `${quote.symbol}-i${i}`,
      shares: Math.round(row.shares * (0.4 + (seed % 5) * 0.12)),
      value: Math.round(row.value * scale * (0.5 + i * 0.08)),
    })),
    funds: NVDA.funds.slice(0, 6).map((row, i) => ({
      ...row,
      shares: Math.round(row.shares * (0.15 + (seed % 7) * 0.04)),
      changeShares: Math.round(row.changeShares * (i % 2 === 0 ? 0.6 : -0.5)),
      weightPct: Number((row.weightPct * (0.4 + (seed % 4) * 0.1)).toFixed(1)),
    })),
    sweeps: NVDA.sweeps.slice(0, 3).map((row, i) => ({
      ...row,
      id: `${quote.symbol}-s${i}`,
      strike: Math.round(quote.price * (1.02 + i * 0.04)),
      spot: quote.price,
      notional: Math.round(row.notional * (0.6 + i * 0.2)),
    })),
    darkPool: NVDA.darkPool.slice(0, 3).map((row, i) => ({
      ...row,
      id: `${quote.symbol}-d${i}`,
      price: Number((quote.price * (1 + (i - 1) * 0.001)).toFixed(2)),
      notional: Math.round(row.notional * scale * 0.8),
    })),
    whales: NVDA.whales.slice(0, 3).map((row, i) => ({
      ...row,
      id: `${quote.symbol}-w${i}`,
      headline: row.headline.replace('NVDA', quote.symbol),
      detail: row.detail.replaceAll('NVDA', quote.symbol),
    })),
  }
}

export const DEEP_DIVES: Record<string, StockDeepDive> = {
  NVDA,
  AAPL,
  TSLA,
  BABA: cloneFor(UNIVERSE[3], 11),
  MSFT: cloneFor(UNIVERSE[4], 17),
  AMZN: cloneFor(UNIVERSE[5], 23),
  META: cloneFor(UNIVERSE[6], 29),
  GOOGL: cloneFor(UNIVERSE[7], 31),
  JPM: cloneFor(UNIVERSE[8], 37),
  XOM: cloneFor(UNIVERSE[9], 41),
  AVGO: cloneFor(UNIVERSE[10], 43),
  LLY: cloneFor(UNIVERSE[11], 47),
}

export const NOTIFICATIONS = [
  { id: '1', title: 'NVDA unusual call sweep', body: '$18.5M ask-side 185C printed in the last 10 minutes.', time: '10m' },
  { id: '2', title: 'Form 4: AAPL CEO sale', body: 'Timothy Cook sold 98,066 shares via 10b5-1.', time: '2h' },
  { id: '3', title: 'Sector rotation', body: 'Semiconductors led 1D institutional net inflow at +$6.8B.', time: '4h' },
]

export function searchTickers(query: string): TickerQuote[] {
  const q = query.trim().toLowerCase()
  if (!q) return UNIVERSE.slice(0, 6)
  return UNIVERSE.filter(
    (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
  ).slice(0, 8)
}
