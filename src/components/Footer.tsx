import { useEffect, useRef, useState } from 'react'

import { useSpace } from '../hooks/queries'
import { cn } from '../lib/cn'
import { ROLE } from '../lib/contact'

import Logo from '../images/logo.svg?react'

import Container from './Container'

// Seconds the logo starts to rise after the name and the role.
const STAGGER = 0.1

// How much of the footer has to be in view for what is in it to rise.
const THRESHOLD = 0.15

interface FooterProps {
  // The footer cannot be reached, as the page above it cannot while the
  // menu of small screens is open (see Layout).
  inert?: boolean
}

// Who the site is by: the name and the role, and the logo in the bottom
// right corner. From sm up the footer is in a wide container (see
// Container), so the name and the role are in line with the text of a page
// and the left edge of the cards that end a project (see Project). The logo
// keeps as far from the right edge as the links of the header do, which
// sit that much further in (see Header). The two are centered on each
// other. On small screens the logo is about as tall as the
// name and the role, which sit on the same line at its bottom, with the side
// padding of the text of a page (see Column). From sm up the name and the
// role are set larger than the body text. Both are set in the weight of
// the title of the site (see Header), and the role in the grey of the body
// text.
//
// There is no footer on the not found page, whose sky fills the screen
// (see Layout).
//
// The logo is as tall as the width of the screen allows from sm up and no
// more than a share of its height, so the whole footer fits on the screen.
//
// Once the footer comes into view, the name and the role, and then the
// logo, fade in as they rise into place. Until then they are hidden, and
// they are again once it is out of view, so they rise every time it comes
// into view. That also keeps them from rising while the page above is
// loading and the footer is on screen, when they are held at their start
// and would be hidden again once the page pushes the footer down (see the
// styles). With reduced motion they are just there.
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
      <Container wide>
        <div className="flex w-full items-end justify-between gap-x-6 px-8 py-12 text-foreground/60 sm:items-center sm:gap-x-16 sm:px-0 sm:py-24">
          <div
            className={cn(
              'leading-snug font-medium sm:text-xl sm:leading-tight md:text-2xl xl:text-3xl',
              settle,
            )}>
            <strong className="block">{space?.name}</strong>
            <span className="block">{ROLE}</span>
          </div>
          {/* Cropped to the letter, and given its ratio, as the file is
              square, so it sits in the corner. */}
          <Logo
            className={cn(
              'block aspect-[390.2/500] h-10 w-auto flex-none fill-foreground sm:mr-7.5 sm:h-[min(20vw,25svh)]',
              settle,
            )}
            style={{ animationDelay: `${STAGGER}s` }}
            viewBox="54.9 0 390.2 500"
            aria-hidden="true"
          />
        </div>
      </Container>
    </footer>
  )
}
