import { tv } from 'tailwind-variants/lite'

import type { VariantOption } from '../lib/utils/variants'

// Every part of the card is a slot, and each variant only sets the slots it
// changes. The variants are independent, so they can be combined freely.
// The lite build only joins the classes of a slot, so Card passes them
// through cn for a variant to win over what it overrides.
export const cardVariants = tv({
  slots: {
    root: 'w-full flex-none',
    link: 'group relative block no-underline hover:text-inherit',
    media:
      'overflow-hidden bg-black [&_img]:h-full [&_img]:object-cover [&_img]:transition-[scale,opacity] [&_img]:duration-500 group-hover:[&_img]:scale-100 group-hover:[&_img]:opacity-100 can-hover:[&_img]:scale-103 can-hover:[&_img]:opacity-90 [&_picture]:h-full',
    overlay:
      'inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-6 pt-28 xl:p-8 xl:pt-36',
    title: 'mb-0 text-white',
    label: 'block font-normal tracking-normal text-white/70',
  },
  variants: {
    // Half leaves room for the column gap of a two column grid from sm up
    // (see Home). Full is as wide as the row it is in (see Project). Pair is
    // for two cards that sit side by side, with a gap between them from sm
    // up. Below sm each takes nearly all of the row, which scrolls, and the
    // rest shows the edge of the other card. From sm up they share the width
    // of a row that sets the height (see Project).
    width: {
      half: { root: 'sm:w-[calc(50%-1rem)] xl:w-[calc(50%-2rem)]' },
      full: {},
      pair: {
        root: 'w-[92%] sm:h-full sm:min-w-0 sm:flex-1',
        link: 'sm:h-full',
        // The image zooms in a little on hover, where other cards zoom out.
        media:
          'sm:aspect-auto sm:h-full group-hover:[&_img]:scale-105 can-hover:[&_img]:scale-100',
      },
    },
    // Every image is cropped to the same ratio, so the rows of a grid line
    // up. Portrait is 8:11, the ratio most images are uploaded in. Landscape
    // is square on small screens and 16:9 from sm up.
    aspect: {
      portrait: { media: 'aspect-8/11' },
      landscape: { media: 'aspect-square sm:aspect-video' },
    },
    // Where the title sits on the image: at the bottom, where devices that
    // can hover only reveal it on hover, or always visible and centered over
    // a darkened image. Both only apply with an image (see the compounds
    // below).
    titlePosition: {
      bottom: {},
      center: {},
    },
    size: {
      sm: {
        title: 'text-2xl md:text-3xl xl:text-4xl',
        label: 'mb-0.5 text-sm xl:text-base',
      },
      md: {
        title: 'text-2xl md:text-3xl xl:text-5xl',
        label: 'mb-0.5 text-sm xl:text-base',
      },
      lg: {
        title: 'text-3xl sm:text-4xl md:text-5xl xl:text-6xl',
        label: 'mb-0.5 text-sm sm:mb-2 sm:text-base xl:text-lg',
      },
    },
    // Without an image the title sits on a dark tile of its own.
    hasImage: {
      true: { overlay: 'absolute' },
      false: { overlay: 'bg-neutral-900' },
    },
  },
  compoundVariants: [
    {
      hasImage: true,
      titlePosition: 'bottom',
      className: {
        overlay:
          'transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 can-hover:opacity-0',
        title:
          'transition-[translate] duration-500 group-hover:translate-y-0 group-focus-visible:translate-y-0 can-hover:translate-y-3',
      },
    },
    // The top padding that makes room for the gradient would push a centered
    // title off center, so it matches the other sides.
    {
      hasImage: true,
      titlePosition: 'center',
      className: {
        overlay:
          'inset-0 flex items-center justify-center bg-black/25 bg-none pt-6 text-center xl:pt-8',
      },
    },
  ],
  defaultVariants: {
    width: 'half',
    aspect: 'portrait',
    titlePosition: 'bottom',
    size: 'md',
  },
})

export type CardWidth = VariantOption<typeof cardVariants, 'width'>
export type CardSlot = keyof ReturnType<typeof cardVariants>

// The largest image each width requests and how wide it is displayed. A half
// width card fills the viewport minus the grid's padding on small screens,
// then half of what the container and the grid's padding and gap leave (see
// Home and Container). A full width card fills the viewport on small
// screens, then what the padding of the wide container leaves, up to its
// max width (see Project). Each card of a pair fills nearly all of the
// viewport on small screens, then half of what the padding of the wide
// container and the gap leave.
export const CARD_IMAGE: Record<CardWidth, { width: number; sizes: string }> = {
  half: {
    width: 1170,
    sizes:
      '(min-width: 100rem) 41.25rem, (min-width: 90.9375rem) calc(50vw - 8.75rem), (min-width: 48rem) calc(50vw - 6.75rem), calc(100vw - 2rem)',
  },
  full: {
    width: 2560,
    sizes:
      '(min-width: 120rem) 106.5rem, (min-width: 48rem) calc(100vw - 13.5rem), 100vw',
  },
  pair: {
    width: 2000,
    sizes:
      '(min-width: 120rem) 51.25rem, (min-width: 48rem) calc(50vw - 8.75rem), 92vw',
  },
}
