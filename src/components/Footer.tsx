import { useEffect, useRef, useState } from 'react'

import { useSpace } from '../hooks/queries'
import { cn } from '../lib/cn'
import { ROLE } from '../lib/contact'

// How much of the footer has to be in view for what is in it to rise.
const THRESHOLD = 0.15

interface FooterProps {
  // The footer cannot be reached, as the page above it cannot while the
  // menu of small screens is open (see Layout).
  inert?: boolean
}

// Who the site is by: the name to the left and the role to the right, small,
// at the bottom of the page, with the role in the grey of the body text. The
// footer has the side padding of the header, so the name is in line with the
// logo and the role with the links (see Header).
//
// There is no footer on the not found page, whose sky fills the screen
// (see Layout).
//
// Once the footer comes into view, the name and the role fade in as they
// rise into place. Until then they are hidden, and they are again once it
// is out of view, so they rise every time it comes into view. That also
// keeps them from rising while the page above is loading and the footer is
// on screen, when they are held at their start and would be hidden again
// once the page pushes the footer down (see the styles). With reduced
// motion they are just there.
export default function Footer({ inert = false }: FooterProps) {
  const { data: space } = useSpace()
  const footer = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!footer.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setInView(false)
        else if (entry.intersectionRatio >= THRESHOLD) setInView(true)
      },
      { threshold: [0, THRESHOLD] },
    )

    observer.observe(footer.current)

    return () => observer.disconnect()
  }, [])

  const settle = inView ? 'motion-safe:animate-settle' : 'motion-safe:opacity-0'

  return (
    <footer
      ref={footer}
      className="peer-has-data-sky/main:hidden"
      inert={inert}>
      <div
        className={cn(
          'flex w-full flex-wrap items-baseline justify-between gap-x-6 px-12 pt-12 pb-8 text-sm text-foreground/60 sm:px-16 sm:pt-24',
          settle,
        )}>
        <strong className="font-medium">{space?.name}</strong>
        <span className="sm:mr-7.5">{ROLE}</span>
      </div>
    </footer>
  )
}
