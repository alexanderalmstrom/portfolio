import { useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import Grain from './Grain'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children?: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  // The page behind the open menu of small screens cannot be reached.
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    // The page is at least as tall as the screen and main takes what is
    // left of it, so the footer is at the bottom of the screen when the page
    // is short, and stays clear of the loading screen (see Loading).
    //
    // The background of main hides the grain of the site, so it holds a
    // grain of its own, which is clipped to it as it would lie over the
    // footer as well. The footer is made anew for every page, so what is in
    // it rises in again as it comes into view there (see Footer).
    //
    // The sky of the not found page fills the screen, so there main is
    // neither filled nor clipped and the grain of the site shows as it is.
    // The footer is left out there (see Footer).
    // The group and the peer are named, as a card is a group of its own
    // that hovering anywhere in main would otherwise set off (see Card).
    <div className="flex min-h-svh flex-col">
      <Header menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
      <main
        className="group/main peer/main relative z-1 grow bg-background pt-25 pb-6 [clip-path:inset(0)] has-data-sky:bg-transparent has-data-sky:[clip-path:none] sm:pt-30"
        inert={menuOpen}>
        <Grain className="group-has-data-sky/main:hidden" />
        {children}
      </main>
      <Footer key={pathname} inert={menuOpen} />
    </div>
  )
}
