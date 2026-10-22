import { useLoaded } from '../hooks/useLoaded'
import { animateIn } from '../lib/animate'
import { cn } from '../lib/cn'
import { imageSources } from '../lib/image'
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

  const sources = imageSources(image, width, quality)

  if (!image || !sources) return null

  const { original, largest, url, srcSet } = sources

  const loaded = onLoad ?? handleLoaded

  // An image on a page rendered on the server can be there before the
  // browser has taken the page over, and so before anything listens for it
  // to load. It counts as loaded as soon as it is found to be complete.
  const ref = (img: HTMLImageElement | null) => {
    if (img?.complete) loaded()
  }

  // Setting the size on the img reserves its space before it loads, so the
  // page already has its full height when a scroll position is restored.
  return (
    <picture className={cn('block', !onLoad && animateIn(isLoaded))}>
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      {/* A failed image is shown as well, so its alt text is not left hidden. */}
      <img
        ref={ref}
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
        onLoad={loaded}
        onError={loaded}
      />
    </picture>
  )
}
