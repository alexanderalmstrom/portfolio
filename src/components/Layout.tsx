import { useState } from 'react'
import type { ReactNode } from 'react'

import Grain from './Grain'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children?: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  // The page behind the open menu of small screens cannot be reached.
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    // The page is at least as tall as the screen and main takes what is
    // left of it, so the footer is at the bottom of the screen when the page
    // is short, and stays clear of the loading screen (see Loading).
    //
    // Main covers the footer, which stays at the bottom of the screen behind
    // it until the end of the page is scrolled there (see Footer). Its
    // background hides the grain of the site, so it holds a grain of its
    // own, which is clipped to it as it would lie over the footer as well.
    //
    // The sky of the not found page fills the screen, so there main is
    // neither filled nor clipped and the grain of the site shows as it is.
    // The footer lies over the sky instead of behind the page (see Footer).
    <div className="flex min-h-svh flex-col">
      <Header menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
      <main
        className="group peer relative z-1 grow bg-background pt-25 pb-6 [clip-path:inset(0)] has-data-sky:bg-transparent has-data-sky:[clip-path:none] sm:pt-30"
        inert={menuOpen}>
        <Grain className="group-has-data-sky:hidden" />
        {children}
      </main>
      <Footer inert={menuOpen} />
    </div>
  )
}
