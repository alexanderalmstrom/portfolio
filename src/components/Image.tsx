import { cn } from '../lib/cn'
import { columnClass, columnSizes } from '../lib/grid'
import type { ImageEntry } from '../types/contentful'

import ImageContentful from './ImageContentful'

interface ImageProps {
  entry?: ImageEntry
  loading?: 'lazy' | 'eager'
}

function imageWidth(size?: number) {
  if (!size) return 1920

  if (size <= 6) return 960

  if (size <= 9) return 1280

  return 1920
}

export default function Image({ entry, loading }: ImageProps) {
  if (!entry || !entry.fields) return null

  const { image, size } = entry.fields

  if (!image) return null

  return (
    <div
      className={cn(
        columnClass(size),
        'mb-4 px-4 last-of-type:mb-0 sm:mb-16 sm:px-8',
      )}>
      <ImageContentful
        image={image}
        width={imageWidth(size)}
        sizes={columnSizes(size)}
        loading={loading}
      />
    </div>
  )
}
