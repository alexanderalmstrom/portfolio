import { useEffect, useId, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { cn } from '../lib/cn'

const LINKS = [{ to: '/page/about', label: 'About' }]

// Seconds between the links starting to rise in when the dialog opens, and
// how long the first one waits for the dialog to fade in.
const STAGGER = 0.08
const DELAY = 0.1

// Has to match the sm breakpoint, from where the header shows its links
// itself and the toggle is hidden.
const WIDE = '(min-width: 48rem)'

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// The navigation of small screens: a toggle in the header and the dialog it
// opens. The dialog covers the page but sits behind the rest of the header,
// so the toggle that opened it is also what closes it.
export default function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const id = useId()
  const toggle = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  // Following a link closes the dialog, and so does going back or forward.
  useEffect(() => {
    onOpenChange(false)
  }, [location, onOpenChange])

  useEffect(() => {
    if (!open) return

    const wide = window.matchMedia(WIDE)
    const close = () => onOpenChange(false)

    // The focus may be on a link that is about to become inert.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key != 'Escape') return

      toggle.current?.focus()
      close()
    }

    // The page stays where it was scrolled to, it just cannot be scrolled
    // further. Taking the body out of the flow instead would reset the scroll
    // position that ScrollRestoration saves when a link is followed.
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = 'hidden'

    document.addEventListener('keydown', onKeyDown)
    wide.addEventListener('change', close)

    return () => {
      document.documentElement.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
      wide.removeEventListener('change', close)
    }
  }, [open, onOpenChange])

  return (
    <>
      <div className="overflow-hidden sm:hidden">
        <button
          ref={toggle}
          className="flex h-11 cursor-pointer items-center text-foreground motion-safe:animate-rise"
          style={{ animationDelay: `${STAGGER * 2}s` }}
          type="button"
          aria-label={open ? 'Close' : 'Menu'}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => onOpenChange(!open)}>
          {/* The two words are stacked behind a mask that is one line tall.
              Opening moves them up, so "Menu" rises out and "Close" rises
              in, and closing moves them back down. */}
          <span className="block h-[1lh] overflow-hidden" aria-hidden="true">
            <span
              className={cn(
                'flex flex-col items-end transition-[translate] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                open && '-translate-y-1/2',
              )}>
              <span>Menu</span>
              <span>Close</span>
            </span>
          </span>
        </button>
      </div>
      <div
        id={id}
        className={cn(
          'fixed inset-0 -z-1 flex touch-none items-center overscroll-none bg-background px-12 transition-[opacity,visibility] duration-300 sm:hidden',
          !open && 'invisible opacity-0',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}>
        <nav>
          <ul className="mb-0 list-none pl-0">
            {LINKS.map(({ to, label }, index) => (
              <li key={to} className="mb-2 overflow-hidden pb-1">
                <Link
                  className={cn(
                    'block text-[2.5rem] leading-[1.1] font-medium tracking-[-0.02em] no-underline',
                    open && 'motion-safe:animate-rise',
                  )}
                  style={{ animationDelay: `${DELAY + STAGGER * index}s` }}
                  to={to}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
