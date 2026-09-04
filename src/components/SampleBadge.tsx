type SampleBadgeProps = {
  className?: string
}

export function SampleBadge({ className = '' }: SampleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-200 ${className}`}
    >
      Mock
    </span>
  )
}

export function LiveBadge({ label = 'Live', className = '' }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-flow-green/30 bg-flow-green/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-flow-green ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-flow-green live-dot" />
      {label}
    </span>
  )
}

