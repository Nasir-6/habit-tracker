import Confetti from 'react-confetti'
import { useEffect, useState } from 'react'

type CompletionConfettiProps = {
  runKey: number
  sourceElement: HTMLElement
}

type ViewportSize = {
  width: number
  height: number
}

type ConfettiSource = {
  x: number
  y: number
  w: number
  h: number
}

const HIDE_AFTER_MS = 3500

export function CompletionConfetti({
  runKey,
  sourceElement,
}: CompletionConfettiProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  })
  const [confettiSource, setConfettiSource] = useState<ConfettiSource | null>(
    null,
  )

  useEffect(() => {
    const updateConfettiMetrics = () => {
      const sourceRect = sourceElement.getBoundingClientRect()

      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })

      setConfettiSource({
        x: sourceRect.left + sourceRect.width / 2,
        y: sourceRect.top + sourceRect.height / 2,
        w: 6,
        h: 6,
      })
    }

    updateConfettiMetrics()

    window.addEventListener('resize', updateConfettiMetrics)
    window.addEventListener('scroll', updateConfettiMetrics, true)

    return () => {
      window.removeEventListener('resize', updateConfettiMetrics)
      window.removeEventListener('scroll', updateConfettiMetrics, true)
    }
  }, [sourceElement])

  useEffect(() => {
    setIsVisible(true)

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false)
    }, HIDE_AFTER_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [runKey])

  if (
    !isVisible ||
    viewportSize.width === 0 ||
    viewportSize.height === 0 ||
    !confettiSource
  ) {
    return null
  }

  return (
    <Confetti
      className="pointer-events-none !fixed !inset-0 !z-[60]"
      width={viewportSize.width}
      height={viewportSize.height}
      numberOfPieces={1000}
      recycle={false}
      gravity={0.2}
      wind={0}
      tweenDuration={500}
      confettiSource={confettiSource}
      initialVelocityX={{ min: -5, max: 20 }}
      initialVelocityY={{ min: -20, max: 0 }}
      aria-hidden="true"
    />
  )
}
