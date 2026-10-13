import { Link } from 'react-router-dom'

import { useSpace } from '../hooks/queries'

import Logo from '../images/logo.svg?react'

import MobileNav from './MobileNav'

// Seconds between the logo, the title and the navigation starting to roll in.
const STAGGER = 0.08

// Each part rolls in through a mask when the site opens, like the heading of
// a hero: its parent hides the overflow and the part itself rises into it.
interface HeaderProps {
  menuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
}

export default function Header({ menuOpen, onMenuOpenChange }: HeaderProps) {
  const { data: space } = useSpace()

  return (
    <header className="fixed z-1000 flex h-25 w-full items-center sm:h-30">
      <div className="fixed inset-y-0 left-0 -z-1 hidden h-full w-30 flex-nowrap items-center justify-center font-medium text-foreground sm:flex">
        {/* The title is turned a quarter, so what rises from below its
            baseline comes in from the right on screen. */}
        <span className="block flex-none origin-center transform-[rotate(-90deg)_translateY(50%)_translateX(-18%)] overflow-hidden whitespace-nowrap">
          <span
            className="block motion-safe:animate-rise"
            style={{ animationDelay: `${STAGGER}s` }}>
            Senior Frontend Engineer / Designer
          </span>
        </span>
      </div>
      <div className="relative mx-auto flex w-full flex-wrap items-center justify-between px-12 sm:pr-16 sm:pl-16">
        <Link
          className="block size-7.5 overflow-hidden no-underline sm:size-10"
          to="/">
          <Logo className="size-full fill-foreground motion-safe:animate-rise" />
          <span className="sr-only">{space?.name}</span>
        </Link>
        <MobileNav open={menuOpen} onOpenChange={onMenuOpenChange} />
        <nav className="hidden sm:mr-7.5 sm:block">
          <ul className="mb-0">
            <li className="mb-0 overflow-hidden">
              <Link
                className="block no-underline motion-safe:animate-rise"
                style={{ animationDelay: `${STAGGER * 2}s` }}
                to="/page/about">
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
