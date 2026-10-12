import { Link } from 'react-router-dom'

import { useLoaded } from '../hooks/useLoaded'
import { animateDown } from '../lib/animate'
import { cn } from '../lib/cn'
import type { ProjectEntry } from '../types/contentful'

import ImageContentful from './ImageContentful'

interface CardProps {
  entry?: ProjectEntry
  basename: string
  loading?: 'lazy' | 'eager'
}

// How wide a card image is displayed: the viewport minus the grid's padding
// on small screens, then half of what the container and the grid's padding
// and gap leave (see Home and Container).
const SIZES =
  '(min-width: 100rem) 41.25rem, (min-width: 90.9375rem) calc(50vw - 8.75rem), (min-width: 48rem) calc(50vw - 6.75rem), calc(100vw - 4rem)'

// Two columns from sm up; the widths leave room for the grid's column gap
// (see Home). Every image is cropped to the same 8:11 portrait, the ratio
// most of them are uploaded in, so the rows line up. The whole card, title
// included, fades in once its image has loaded.
export default function Card({ entry, basename, loading }: CardProps) {
  const [isLoaded, handleLoaded] = useLoaded()

  if (!entry || !entry.fields) return null

  const { image, name, slug } = entry.fields

  return (
    <div
      className={cn(
        'w-full flex-none sm:w-[calc(50%-1rem)] xl:w-[calc(50%-2rem)]',
        animateDown(isLoaded || !image),
      )}>
      <Link
        to={`/${basename}/${slug}`}
        className="group relative block no-underline hover:text-inherit">
        {image ? (
          <div className="aspect-8/11 overflow-hidden bg-black [&_img]:h-full [&_img]:object-cover [&_img]:transition-[scale,opacity] [&_img]:duration-500 group-hover:[&_img]:scale-100 group-hover:[&_img]:opacity-100 can-hover:[&_img]:scale-103 can-hover:[&_img]:opacity-90 [&_picture]:h-full">
            <ImageContentful
              image={image}
              width={1170}
              sizes={SIZES}
              loading={loading}
              onLoad={handleLoaded}
            />
          </div>
        ) : null}
        {/* Without an image the title sits on a dark tile of its own. With
            one, devices that can hover only reveal the title on hover. */}
        <div
          className={cn(
            'inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-4 pt-28 xl:p-6 xl:pt-36',
            image
              ? 'absolute transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 can-hover:opacity-0'
              : 'bg-neutral-900',
          )}>
          <h2
            className={cn(
              'mb-0 text-xl text-white md:text-2xl xl:text-3xl',
              image &&
                'transition-[translate] duration-500 group-hover:translate-y-0 group-focus-visible:translate-y-0 can-hover:translate-y-3',
            )}>
            {name}
          </h2>
        </div>
      </Link>
    </div>
  )
}
