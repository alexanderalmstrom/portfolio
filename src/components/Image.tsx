import type { CSSProperties } from 'react'

import { useInView } from '../hooks/useInView'
import { useLoaded } from '../hooks/useLoaded'
import { cn } from '../lib/cn'
import { columnClass, columnSizes } from '../lib/grid'
import type { ImageEntry } from '../types/contentful'

import ImageContentful from './ImageContentful'

interface ImageProps {
  entry?: ImageEntry
  loading?: 'lazy' | 'eager'
  // The image also slides in from the right as it fades in, and waits to
  // do so until it is in view.
  slide?: boolean
  // How many images slide in before this one in the same row, which
  // starts with the one furthest to the right.
  stagger?: number
}

// Seconds between the images of a row starting to slide in.
const STAGGER = 0.1

function imageWidth(size?: number) {
  if (!size) return 1920

  if (size <= 6) return 960

  if (size <= 9) return 1280

  return 1920
}

export default function Image({
  entry,
  loading,
  slide = false,
  stagger = 0,
}: ImageProps) {
  const [isLoaded, handleLoaded] = useLoaded()
  const [column, inView] = useInView<HTMLDivElement>(slide)

  if (!entry || !entry.fields) return null

  const { image, size } = entry.fields

  if (!image) return null

  // The image slides in once it has loaded and come into view, whichever
  // happens last. The column is what is watched, as it stays in place. The
  // images of a row slide in one after the other from sm up, where they sit
  // side by side. Below that each is a row of its own and comes into view
  // by itself.
  return (
    <div ref={column} className={cn(columnClass(size), 'px-4 sm:px-8')}>
      <div
        className={cn(
          slide &&
            (isLoaded && inView
              ? 'motion-safe:animate-slide motion-reduce:animate-fade-in sm:[animation-delay:var(--slide-delay)]'
              : 'opacity-0'),
        )}
        style={
          {
            '--slide-delay': `${stagger * STAGGER}s`,
          } as CSSProperties
        }>
        <ImageContentful
          image={image}
          width={imageWidth(size)}
          sizes={columnSizes(size)}
          loading={loading}
          onLoad={slide ? handleLoaded : undefined}
        />
      </div>
    </div>
  )
}
