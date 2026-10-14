import { useState } from 'react'
import type { CSSProperties } from 'react'

interface LoadingProps {
  message?: string
}

// How long one turn of the triangle takes, in milliseconds (see
// --animate-loading-spin).
const TURN = 1000

export default function Loading({ message = 'Loading' }: LoadingProps) {
  // One loading screen often takes over from another, as when the app has
  // loaded and the page in it has not, or when the cover between two pages
  // lifts off a page that is still loading. Each triangle starts as far into
  // its turn as the time on the clock says, so they all turn as one and the
  // change from one to the next does not show.
  const [delay] = useState(() => -(performance.now() % TURN))

  // The attribute is for the footer, which waits for the page above it to
  // have loaded (see the styles).
  return (
    <div
      className="fixed top-0 left-0 flex size-full items-center justify-center text-center text-foreground"
      data-loading="">
      <div className="flex flex-col items-center justify-center">
        <i
          className="flex items-center justify-center after:block after:size-0 after:origin-[8px_6px] after:animate-loading-spin after:border-x-8 after:border-y-16 after:border-transparent after:border-t-foreground after:content-[''] after:[animation-delay:var(--spin-delay)]"
          style={{ '--spin-delay': `${delay}ms` } as CSSProperties}
        />
        <p className="hidden text-[0.875rem]">{message}</p>
      </div>
    </div>
  )
}
