/**
 * MatchRing
 * ─────────
 * Animated SVG ring showing the SBERT match score.
 * Colour-codes green ≥ 85, brand-blue ≥ 70, amber ≥ 55, slate < 55.
 */
interface MatchRingProps {
  score:  number
  size?:  number   // px, default 52
  stroke?: number  // default 4
}

export function MatchRing({ score, size = 52, stroke = 4 }: MatchRingProps) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  const color =
    score >= 85 ? '#22c55e'
    : score >= 70 ? '#6366f1'
    : score >= 55 ? '#f59e0b'
    : '#64748b'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      {/* Label */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center leading-none"
        style={{ color }}
      >
        <span className="text-xs font-bold">{score}%</span>
      </div>
    </div>
  )
}
