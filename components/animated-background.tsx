"use client"

import { currentTheme, animationGradients, animations } from "@/lib/theme-config"
import { useMemo, useState, useEffect } from "react"

interface AnimatedBackgroundProps {
  density?: "low" | "medium" | "high"
}

// Seeded random number generator for consistent server/client rendering
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
}

// Grid-based distribution that ensures even coverage with controlled randomness
const generateGridDistributedPositions = (count: number, gridSize = 6, seed = 123): { x: number; y: number }[] => {
  const rng = new SeededRandom(seed)
  const cellSize = 100 / gridSize
  const positions: { x: number; y: number }[] = []

  // Create all possible grid cells
  const allCells: string[] = []
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      allCells.push(`${x}-${y}`)
    }
  }

  // Shuffle all cells using seeded random
  for (let i = allCells.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[allCells[i], allCells[j]] = [allCells[j], allCells[i]]
  }

  // Take as many cells as we need shapes
  const selectedCells = allCells.slice(0, Math.min(count, allCells.length))

  // Generate positions within the selected cells
  for (const cellKey of selectedCells) {
    const [gridX, gridY] = cellKey.split("-").map(Number)

    // Add randomness within the cell with better centering
    const margin = cellSize * 0.15 // 15% margin within cell
    const availableSpace = cellSize - margin * 2
    const offsetX = margin + rng.next() * availableSpace
    const offsetY = margin + rng.next() * availableSpace

    positions.push({
      x: gridX * cellSize + offsetX,
      y: gridY * cellSize + offsetY,
    })
  }

  return positions
}

export function AnimatedBackground({ density = "high" }: AnimatedBackgroundProps = {}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const showLowDensity = density === "low"
  const showMediumDensity = density === "medium"

  const orbCount = showLowDensity ? 1 : showMediumDensity ? 2 : 3
  const largeSquareCount = showLowDensity ? 0 : showMediumDensity ? 1 : 2
  const mediumSquareCount = showLowDensity ? 2 : showMediumDensity ? 3 : 4
  const smallSquareCount = showLowDensity ? 6 : showMediumDensity ? 8 : 10
  const extraSmallSquareCount = showLowDensity ? 5 : showMediumDensity ? 6 : 8
  const largeCircleCount = showLowDensity ? 0 : showMediumDensity ? 1 : 2
  const mediumCircleCount = showLowDensity ? 2 : showMediumDensity ? 3 : 4
  const smallCircleCount = showLowDensity ? 6 : showMediumDensity ? 8 : 10
  const tinyCircleCount = showLowDensity ? 5 : showMediumDensity ? 6 : 8
  const particleCount = showLowDensity ? 8 : showMediumDensity ? 12 : 15

  // Use different grid sizes and seeds for different shape types to avoid alignment patterns
  const orbPositions = useMemo(() => generateGridDistributedPositions(orbCount, 3, 100), [orbCount])
  const largeSquarePositions = useMemo(() => generateGridDistributedPositions(largeSquareCount, 3, 200), [largeSquareCount])
  const mediumSquarePositions = useMemo(
    () => generateGridDistributedPositions(mediumSquareCount, 4, 300),
    [mediumSquareCount],
  )
  const smallSquarePositions = useMemo(() => generateGridDistributedPositions(smallSquareCount, 5, 400), [smallSquareCount])
  const extraSmallSquarePositions = useMemo(
    () => generateGridDistributedPositions(extraSmallSquareCount, 4, 500),
    [extraSmallSquareCount],
  )
  const largeCirclePositions = useMemo(() => generateGridDistributedPositions(largeCircleCount, 3, 600), [largeCircleCount])
  const mediumCirclePositions = useMemo(
    () => generateGridDistributedPositions(mediumCircleCount, 4, 700),
    [mediumCircleCount],
  )
  const smallCirclePositions = useMemo(() => generateGridDistributedPositions(smallCircleCount, 5, 800), [smallCircleCount])
  const tinyCirclePositions = useMemo(() => generateGridDistributedPositions(tinyCircleCount, 4, 900), [tinyCircleCount])
  const particlePositions = useMemo(() => generateGridDistributedPositions(particleCount, 6, 1000), [particleCount])

  // Generate deterministic animation delays for each circle to prevent synchronization
  const randomDelays = useMemo(() => {
    const generateDeterministicDelays = (count: number, seed: number) => {
      const rng = new SeededRandom(seed)
      return Array.from({ length: count }, () => rng.next() * 4) // Random delay between 0-4 seconds
    }

    return {
      large: generateDeterministicDelays(largeCircleCount, 1100),
      medium: generateDeterministicDelays(mediumCircleCount, 1200),
      small: generateDeterministicDelays(smallCircleCount, 1300),
      tiny: generateDeterministicDelays(tinyCircleCount, 1400),
    }
  }, [largeCircleCount, mediumCircleCount, smallCircleCount, tinyCircleCount])

  // Determine which circles bounce vs pulse (alternate for variety)
  const bouncingCircles = useMemo(() => {
    const result = {
      large: new Set<number>(),
      medium: new Set<number>(),
      small: new Set<number>(),
      tiny: new Set<number>(),
    }

    // Make half of each circle type bounce, half pulse
    for (let i = 0; i < largeCircleCount; i++) {
      if (i % 2 === 0) result.large.add(i)
    }
    for (let i = 0; i < mediumCircleCount; i++) {
      if (i % 2 === 0) result.medium.add(i)
    }
    for (let i = 0; i < smallCircleCount; i++) {
      if (i % 2 === 0) result.small.add(i)
    }
    for (let i = 0; i < tinyCircleCount; i++) {
      if (i % 2 === 0) result.tiny.add(i)
    }

    return result
  }, [largeCircleCount, mediumCircleCount, smallCircleCount, tinyCircleCount])

  return (
    <>
      {/* Only render animated elements after client hydration to prevent hydration mismatch */}
      {isClient ? (
        <>
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Large floating orbs */}
            {Array.from({ length: orbCount }).map((_, i) => (
              <div
                key={`orb-${i}`}
                className={`absolute w-72 h-72 ${animationGradients.orbs[i % animationGradients.orbs.length]} rounded-full blur-3xl animate-pulse`}
                style={{
                  left: `${orbPositions[i].x}%`,
                  top: `${orbPositions[i].y}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}

        {/* Large animated squares */}
        {Array.from({ length: largeSquareCount }).map((_, i) => (
          <div
            key={`large-square-${i}`}
            className={`absolute w-16 h-16 ${animationGradients.squares[i % animationGradients.squares.length]} rounded-xl opacity-60`}
            style={{
              left: `${largeSquarePositions[i].x}%`,
              top: `${largeSquarePositions[i].y}%`,
              animationDelay: `${i * 4}s`,
              animationDuration:
                animations.durations.squares.large[i % animations.durations.squares.large.length] || "15s",
              animation: `spin ${animations.durations.squares.large[i % animations.durations.squares.large.length] || "15s"} linear infinite`,
            }}
          />
        ))}

        {/* Medium animated squares */}
        {Array.from({ length: mediumSquareCount }).map((_, i) => (
          <div
            key={`medium-square-${i}`}
            className={`absolute w-12 h-12 ${animationGradients.squares[(i + 2) % animationGradients.squares.length]} rounded-lg opacity-50`}
            style={{
              left: `${mediumSquarePositions[i].x}%`,
              top: `${mediumSquarePositions[i].y}%`,
              animationDelay: `${i + 1}s`,
              animationDuration:
                animations.durations.squares.medium[i % animations.durations.squares.medium.length] || "14s",
              animation: `spin ${animations.durations.squares.medium[i % animations.durations.squares.medium.length] || "14s"} linear infinite`,
            }}
          />
        ))}

        {/* Small animated squares */}
        {Array.from({ length: smallSquareCount }).map((_, i) => {
          const adjustedIndex = i % animationGradients.squares.length
          return (
            <div
              key={`small-square-${i}`}
              className={`absolute w-8 h-8 ${animationGradients.squares[(i + 6) % animationGradients.squares.length]} rounded-md opacity-40`}
              style={{
                left: `${smallSquarePositions[i].x}%`,
                top: `${smallSquarePositions[i].y}%`,
                animationDelay: `${2.8 + i * 1.3}s`,
                animationDuration:
                  animations.durations.squares.small[i % animations.durations.squares.small.length] || "10s",
                animation: `spin ${animations.durations.squares.small[i % animations.durations.squares.small.length] || "10s"} linear infinite`,
              }}
            />
          )
        })}

        {/* Extra small squares */}
        {Array.from({ length: extraSmallSquareCount }).map((_, i) => (
          <div
            key={`extra-small-square-${i}`}
            className={`absolute w-5 h-5 ${animationGradients.squares[(i + 3) % animationGradients.squares.length]} rounded opacity-30`}
            style={{
              left: `${extraSmallSquarePositions[i].x}%`,
              top: `${extraSmallSquarePositions[i].y}%`,
              animationDelay: `${9.5 + i * 1.3}s`,
              animationDuration:
                animations.durations.squares.extraSmall[i % animations.durations.squares.extraSmall.length] || "6s",
              animation: `spin ${animations.durations.squares.extraSmall[i % animations.durations.squares.extraSmall.length] || "6s"} linear infinite`,
            }}
          />
        ))}

        {/* Large animated circles - alternating bounce/pulse with random delays */}
        {Array.from({ length: largeCircleCount }).map((_, i) => (
          <div
            key={`large-circle-${i}`}
            className={`absolute w-20 h-20 ${animationGradients.circles[i % animationGradients.circles.length]} rounded-full opacity-50 ${
              bouncingCircles.large.has(i)
                ? "animate-[bounce_4s_ease-in-out_infinite]"
                : "animate-[circlepulse_4s_ease-in-out_infinite]"
            }`}
            style={{
              left: `${largeCirclePositions[i].x}%`,
              top: `${largeCirclePositions[i].y}%`,
              animationDelay: `${randomDelays.large[i]}s`,
            }}
          />
        ))}

        {/* Medium animated circles - alternating bounce/pulse with random delays */}
        {Array.from({ length: mediumCircleCount }).map((_, i) => (
          <div
            key={`medium-circle-${i}`}
            className={`absolute w-14 h-14 ${animationGradients.circles[(i + 2) % animationGradients.circles.length]} rounded-full opacity-40 ${
              bouncingCircles.medium.has(i)
                ? "animate-[bounce_4s_ease-in-out_infinite]"
                : "animate-[circlepulse_4s_ease-in-out_infinite]"
            }`}
            style={{
              left: `${mediumCirclePositions[i].x}%`,
              top: `${mediumCirclePositions[i].y}%`,
              animationDelay: `${randomDelays.medium[i]}s`,
            }}
          />
        ))}

        {/* Small animated circles - alternating bounce/pulse with random delays */}
        {Array.from({ length: smallCircleCount }).map((_, i) => (
          <div
            key={`small-circle-${i}`}
            className={`absolute w-10 h-10 ${animationGradients.circles[(i + 6) % animationGradients.circles.length]} rounded-full opacity-30 ${
              bouncingCircles.small.has(i)
                ? "animate-[bounce_4s_ease-in-out_infinite]"
                : "animate-[circlepulse_4s_ease-in-out_infinite]"
            }`}
            style={{
              left: `${smallCirclePositions[i].x}%`,
              top: `${smallCirclePositions[i].y}%`,
              animationDelay: `${randomDelays.small[i]}s`,
            }}
          />
        ))}

        {/* Tiny circles - alternating bounce/pulse with random delays */}
        {Array.from({ length: tinyCircleCount }).map((_, i) => (
          <div
            key={`tiny-circle-${i}`}
            className={`absolute w-4 h-4 ${animationGradients.circles[i % animationGradients.circles.length]} rounded-full opacity-25 ${
              bouncingCircles.tiny.has(i)
                ? "animate-[bounce_4s_ease-in-out_infinite]"
                : "animate-[circlepulse_4s_ease-in-out_infinite]"
            }`}
            style={{
              left: `${tinyCirclePositions[i].x}%`,
              top: `${tinyCirclePositions[i].y}%`,
              animationDelay: `${randomDelays.tiny[i]}s`,
            }}
          />
        ))}

        {/* Gradient overlays */}
        <div className={`absolute inset-0 ${currentTheme.primary.gradient} opacity-5`} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: particleCount }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className={`absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse`}
            style={{
              left: `${particlePositions[i].x}%`,
              top: `${particlePositions[i].y}%`,
              animationDelay: `${randomDelays.tiny[i % randomDelays.tiny.length] || 0}s`,
              animationDuration: `${2 + (randomDelays.tiny[i % randomDelays.tiny.length] || 0)}s`,
            }}
          />
        ))}
      </div>
    </>
  ) : (
    // Render a simple background during SSR to prevent hydration mismatch
    <div className="absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 ${currentTheme.primary.gradient} opacity-5`} />
    </div>
  )}
</>
  )
}
