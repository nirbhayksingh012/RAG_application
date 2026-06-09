type Props = {
  phaseLabel: string
}

export function GeneratingPlaceholder({ phaseLabel }: Props) {
  return (
    <div
      className="rounded-2xl border border-violet-500/20 bg-zinc-900/80 px-4 py-3 shadow-inner"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-40" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
        </span>
        <span className="text-sm font-medium text-violet-200/95">
          {phaseLabel}
        </span>
      </div>
      <div className="space-y-2 overflow-hidden">
        {[0.85, 0.65, 0.45].map((w, idx) => (
          <div
            key={idx}
            className="relative h-3 overflow-hidden rounded-md bg-zinc-800/90"
            style={{ width: `${w * 100}%` }}
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-violet-400/70 animate-pulse-dot"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
