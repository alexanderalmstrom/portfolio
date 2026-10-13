import { useLoaded } from '../hooks/useLoaded'
import { animateIn } from '../lib/animate'
import { cn } from '../lib/cn'
import type { ImageAsset } from '../types/contentful'

interface ImageContentfulProps {
  image?: ImageAsset
  format?: string
  quality?: number
  // The largest width that is ever requested.
  width?: number
  // How wide the image is displayed, as a sizes attribute.
  sizes?: string
  loading?: 'lazy' | 'eager'
  // Called when the image has loaded or failed. A parent that passes this
  // animates the image as part of something larger, such as a card, so the
  // image does not fade in by itself.
  onLoad?: () => void
}

// The widths offered in srcSet. The browser picks one from the sizes attribute
// and the pixel density of the screen.
const WIDTHS = [320, 480, 640, 800, 960, 1280, 1600, 1920, 2560]

// Each image keeps its own loaded state and fades in when it has loaded. A
// lazy image only starts loading when it gets close to the viewport, so a
// state shared by a whole page would wait on images that have not started.
export default function ImageContentful({
  image,
  format = 'jpg',
  quality = 90,
  width = 1280,
  sizes = '100vw',
  loading = 'lazy',
  onLoad,
}: ImageContentfulProps) {
  const [isLoaded, handleLoaded] = useLoaded()

  if (!image || !image.fields || !image.fields.file) return null

  const { file } = image.fields
  const original = file.details.image

  // Contentful scales an image down to the requested width but never up, so
  // nothing wider than the original is offered.
  const largest = original ? Math.min(width, original.width) : width
  const widths = [...WIDTHS.filter((width) => width < largest), largest]

  const url = (fm: string, w: number) =>
    `${file.url}?${new URLSearchParams({
      ...(fm == 'jpg' && { fl: 'progressive' }),
      fm,
      q: String(quality),
      w: String(w),
    })}`

  const srcSet = (fm: string) =>
    widths.map((width) => `${url(fm, width)} ${width}w`).join(', ')

  // Setting the size on the img reserves its space before it loads, so the
  // page already has its full height when a scroll position is restored.
  return (
    <picture className={cn('block', !onLoad && animateIn(isLoaded))}>
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      {/* A failed image is shown as well, so its alt text is not left hidden. */}
      <img
        className="w-full"
        src={url(format, largest)}
        srcSet={srcSet(format)}
        sizes={sizes}
        alt={image.fields.title}
        width={original ? largest : undefined}
        height={
          original
            ? Math.round((original.height * largest) / original.width)
            : undefined
        }
        loading={loading}
        decoding="async"
        onLoad={onLoad ?? handleLoaded}
        onError={onLoad ?? handleLoaded}
      />
    </picture>
  )
}
