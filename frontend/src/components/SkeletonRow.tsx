import type { ReactElement } from 'react'

export interface SkeletonBar {
  width: number
  height: number
}

export interface SkeletonRowProps {
  bars?: SkeletonBar[]
}

const DESIGN_BARS: SkeletonBar[] = [
  { width: 40, height: 12 },
  { width: 90, height: 14 },
  { width: 70, height: 14 },
]

export function SkeletonRow({ bars = DESIGN_BARS }: SkeletonRowProps): ReactElement {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {bars.map((bar, index) => (
        <div
          className="skeleton-bar"
          key={index}
          style={{ width: `${bar.width}%`, height: `${bar.height}px` }}
        />
      ))}
    </div>
  )
}
