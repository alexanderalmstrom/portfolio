import { useState } from 'react'
import type { ReactNode } from 'react'

import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children?: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  // The page behind the open menu of small screens cannot be reached.
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div>
      <Header menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
      <main className="mb-6 pt-25 sm:pt-30" inert={menuOpen}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
