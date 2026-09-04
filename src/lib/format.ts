export function formatUSD(value: number, compact = true): string {
  const abs = Math.abs(value)
  if (compact && abs >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatShares(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPct(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function signedClass(value: number): string {
  if (value > 0) return 'text-flow-green'
  if (value < 0) return 'text-flow-red'
  return 'text-flow-muted'
}
