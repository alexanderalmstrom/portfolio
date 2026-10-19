import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

interface ContainerProps {
  children?: ReactNode
  className?: string
  // Containers nested inside another container drop the side padding.
  nested?: boolean
  // A wide container reaches further than the images of a page, for what
  // ends it: the cards of a project. It has no columns of its own, so its
  // side padding is that of an image column as well, which keeps what is in
  // it in line with the text and the images of the page and with the header
  // (see Image and Header).
  wide?: boolean
}

export default function Container({
  children,
  className,
  nested = false,
  wide = false,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-wrap',
        wide ? 'max-w-480' : 'max-w-400',
        !nested && (wide ? 'sm:pr-16 sm:pl-38' : 'sm:pr-8 sm:pl-30'),
        className,
      )}>
      {children}
    </div>
  )
}
