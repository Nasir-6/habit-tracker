import { useEffect, useRef, useState } from 'react'

type DailyProgressBarProps = {
  completedCount: number
  totalCount: number
}

const confettiColors = [
  '#f97316',
  '#eab308',
  '#22c55e',
  '#0ea5e9',
  '#ec4899',
  '#a855f7',
]

const confettiParticles = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  leftPercent: ((index * 17) % 100) + 1,
  rotateDeg: (index % 2 === 0 ? 1 : -1) * (15 + ((index * 13) % 35)),
  fallDistance: 44 + ((index * 11) % 26),
  delayMs: (index % 6) * 36,
  durationMs: 680 + ((index * 19) % 260),
  color: confettiColors[index % confettiColors.length],
}))

export function DailyProgressBar({
  completedCount,
  totalCount,
}: DailyProgressBarProps) {
  const previousCompletionPercentRef = useRef(0)
  const [confettiBurstId, setConfettiBurstId] = useState(0)
  const [isConfettiVisible, setIsConfettiVisible] = useState(false)
  const hasHabits = totalCount > 0
  const completionPercent = hasHabits
    ? Math.round((completedCount / totalCount) * 100)
    : 0
  const progressColorClass = !hasHabits
    ? 'bg-slate-300'
    : completionPercent > 50
      ? 'bg-emerald-500'
      : completionPercent > 25
        ? 'bg-amber-500'
        : 'bg-rose-500'

  useEffect(() => {
    const previousCompletionPercent = previousCompletionPercentRef.current
    const reachedCompleteFromBelow =
      hasHabits && completionPercent === 100 && previousCompletionPercent < 100

    if (reachedCompleteFromBelow) {
      setConfettiBurstId((current) => current + 1)
      setIsConfettiVisible(true)
    }

    previousCompletionPercentRef.current = completionPercent
  }, [completionPercent, hasHabits])

  useEffect(() => {
    if (!isConfettiVisible) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsConfettiVisible(false)
    }, 1400)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [confettiBurstId, isConfettiVisible])

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      {isConfettiVisible ? (
        <div
          key={confettiBurstId}
          className="pointer-events-none absolute inset-x-4 -top-1 h-16"
          aria-hidden="true"
        >
          {confettiParticles.map((particle) => (
            <span
              key={`${confettiBurstId}-${particle.id}`}
              className="absolute top-0 block h-2 w-1.5 rounded-sm opacity-0"
              style={{
                left: `${particle.leftPercent}%`,
                backgroundColor: particle.color,
                animationName: 'daily-progress-confetti-fall',
                animationDuration: `${particle.durationMs}ms`,
                animationDelay: `${particle.delayMs}ms`,
                animationTimingFunction: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
                animationFillMode: 'forwards',
                transform: `translateY(0) rotate(0deg)`,
                ['--drift' as string]: `${particle.rotateDeg}px`,
                ['--drop' as string]: `${particle.fallDistance}px`,
              }}
            />
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Daily progress</p>
        <p>{`${completedCount} of ${totalCount}, ${completionPercent}%`}</p>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200"
        role="presentation"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${progressColorClass}`}
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <style>{`
        @keyframes daily-progress-confetti-fall {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0) rotate(0deg);
          }

          10% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translateY(var(--drop)) translateX(var(--drift)) rotate(300deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [style*='daily-progress-confetti-fall'] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
