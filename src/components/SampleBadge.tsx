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
