import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { useSpace } from '../hooks/queries'
import { cn } from '../lib/cn'
import { CONTACT, ROLE } from '../lib/contact'

import Container from './Container'

// Seconds between the lines starting to rise.
const STAGGER = 0.08

interface FooterProps {
  // The footer cannot be reached, as the page above it cannot while the
  // menu of small screens is open (see Layout).
  inert?: boolean
}

// A line that rises through a mask of its own, the way the lines of the
// menu of small screens do (see MobileNav). Until then it waits below its
// mask. With reduced motion it is just there.
function Line({
  children,
  index,
  risen,
}: {
  children: ReactNode
  index: number
  risen: boolean
}) {
  return (
    <span className="block overflow-hidden py-0.5">
      <span
        className={cn(
          'block',
          risen ? 'motion-safe:animate-rise' : 'motion-safe:translate-y-[120%]',
        )}
        style={{ animationDelay: `${STAGGER * index}s` }}>
        {children}
      </span>
    </span>
  )
}

// Who the site is by and how to get in touch: the name and the role on one
// side, the ways to do it on the other. On small screens the two are
// stacked. The side padding is that of the text of a page (see Column), and
// with that of the container it keeps the footer clear of the site title
// from sm up and in line with the navigation on the right. All of it is set
// in the grey of the body text except the name.
//
// The footer stays at the bottom of the screen, behind the page, which
// uncovers it as its end is scrolled away (see Layout). The lines rise one
// after the other, in the order they are read in, when that starts. As the
// footer is on screen all along, what tells is the end of the page coming
// into view, which an empty element above the footer stands in for. Once
// the page covers the footer again the lines go back below their masks, so
// they rise every time it is uncovered.
export default function Footer({ inert = false }: FooterProps) {
  const { data: space } = useSpace()
  const end = useRef<HTMLDivElement>(null)
  const [uncovered, setUncovered] = useState(false)

  useEffect(() => {
    if (!end.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setUncovered(entry.isIntersecting)
    })

    observer.observe(end.current)

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={end} />
      <footer className="sticky bottom-0 peer-has-data-sky:z-2" inert={inert}>
        <Container>
          <address className="flex w-full flex-wrap justify-between gap-x-16 gap-y-6 px-8 pt-10 pb-10 text-foreground/60 not-italic sm:pt-16 sm:pb-12">
            <div>
              <Line index={0} risen={uncovered}>
                <strong>{space?.name}</strong>
              </Line>
              <Line index={1} risen={uncovered}>
                {ROLE}
              </Line>
            </div>
            <div className="sm:text-right">
              {CONTACT.map(({ href, label }, index) => (
                <Line key={href} index={index + 2} risen={uncovered}>
                  <a
                    className="text-inherit no-underline hover:underline"
                    href={href}>
                    {label}
                  </a>
                </Line>
              ))}
            </div>
          </address>
        </Container>
      </footer>
    </>
  )
}
