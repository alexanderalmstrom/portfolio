import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { VariantProps } from 'tailwind-variants/lite'

import { useLoaded } from '../hooks/useLoaded'
import { animateIn } from '../lib/animate'
import { cn } from '../lib/cn'
import type { ImageAsset } from '../types/contentful'

import { CARD_IMAGE, cardVariants } from './Card.variants'
import type { CardSlot } from './Card.variants'
import ImageContentful from './ImageContentful'

// hasImage follows from the image, so it is not a prop.
type CardVariantProps = Omit<VariantProps<typeof cardVariants>, 'hasImage'>

interface CardProps extends CardVariantProps {
  to: string
  title: ReactNode
  // A line above the title, such as "Next project".
  label?: ReactNode
  image?: ImageAsset
  loading?: 'lazy' | 'eager'
  // The card also moves up into place as it fades in.
  rise?: boolean
  // Extra classes for any slot, merged after those of the variants.
  classNames?: Partial<Record<CardSlot, string>>
}

// The whole card, title included, fades in once its image has loaded.
export default function Card({
  to,
  title,
  label,
  image,
  loading,
  rise,
  classNames,
  width = 'half',
  ...variants
}: CardProps) {
  const [isLoaded, handleLoaded] = useLoaded()

  const {
    root: rootSlot,
    link: linkSlot,
    media: mediaSlot,
    overlay: overlaySlot,
    title: titleSlot,
    label: labelSlot,
  } = cardVariants({ ...variants, width, hasImage: Boolean(image) })

  return (
    <div
      className={cn(
        rootSlot({
          className: [animateIn(isLoaded || !image, rise), classNames?.root],
        }),
      )}>
      <Link to={to} className={cn(linkSlot({ className: classNames?.link }))}>
        {image ? (
          <div className={cn(mediaSlot({ className: classNames?.media }))}>
            <ImageContentful
              image={image}
              width={CARD_IMAGE[width].width}
              sizes={CARD_IMAGE[width].sizes}
              loading={loading}
              onLoad={handleLoaded}
            />
          </div>
        ) : null}
        <div className={cn(overlaySlot({ className: classNames?.overlay }))}>
          <h2 className={cn(titleSlot({ className: classNames?.title }))}>
            {label ? (
              <span className={cn(labelSlot({ className: classNames?.label }))}>
                {label}
              </span>
            ) : null}
            {title}
          </h2>
        </div>
      </Link>
    </div>
  )
}
