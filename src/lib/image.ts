import { createIsomorphicFn } from '@tanstack/react-start'

import type { ImageAsset } from '../types/contentful'

// The widths offered in srcSet. The browser picks one from the sizes attribute
// and the pixel density of the screen.
const WIDTHS = [320, 480, 640, 800, 960, 1280, 1600, 1920, 2560]

// The addresses an image is requested from, up to the given width, which is
// the largest that is ever asked for.
export function imageSources(image?: ImageAsset, width = 1280, quality = 90) {
  const file = image?.fields?.file

  if (!file) return null

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

  return { original, largest, url, srcSet }
}

// What an image is shown with: the asset, the largest width it is requested
// in and its sizes attribute.
export interface ImageRequest {
  image?: ImageAsset
  width: number
  sizes: string
}

// Starts loading an image before anything shows it. It is requested the way
// ImageContentful will ask for it, so the browser has it by then. Only in
// the browser, as a page rendered on the server has its images in it.
export const preloadImage = createIsomorphicFn().client(
  ({ image, width, sizes }: ImageRequest) => {
    const sources = imageSources(image, width)

    if (!sources) return

    const preloaded = new Image()

    preloaded.sizes = sizes
    preloaded.srcset = sources.srcSet('webp')
  },
)
