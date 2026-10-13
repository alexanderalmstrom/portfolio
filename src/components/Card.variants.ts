import { tv } from 'tailwind-variants'

import type { VariantOption } from '../lib/utils/variants'

// Every part of the card is a slot, and each variant only sets the slots it
// changes. The variants are independent, so they can be combined freely.
export const cardVariants = tv({
  slots: {
    root: 'w-full flex-none',
    link: 'group relative block no-underline hover:text-inherit',
    media:
      'overflow-hidden bg-black [&_img]:h-full [&_img]:object-cover [&_img]:transition-[scale,opacity] [&_img]:duration-500 group-hover:[&_img]:scale-100 group-hover:[&_img]:opacity-100 can-hover:[&_img]:scale-103 can-hover:[&_img]:opacity-90 [&_picture]:h-full',
    overlay: 'inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent',
    title: 'mb-0 text-white',
    label: 'block font-normal tracking-normal text-white/70',
  },
  variants: {
    // Half leaves room for the column gap of a two column grid from sm up
    // (see Home). Full is as wide as the viewport, up to the container's max
    // width, and lines its title up with the header.
    width: {
      half: {
        root: 'sm:w-[calc(50%-1rem)] xl:w-[calc(50%-2rem)]',
        overlay: 'p-4 pt-28 xl:p-6 xl:pt-36',
      },
      full: {
        root: 'mx-auto max-w-400',
        overlay: 'p-8 pt-28 sm:p-16 sm:pt-36',
      },
    },
    // Every image is cropped to the same ratio, so the rows of a grid line
    // up. Portrait is 8:11, the ratio most images are uploaded in. Landscape
    // keeps the portrait on small screens and is 16:9 from sm up.
    aspect: {
      portrait: { media: 'aspect-8/11' },
      landscape: { media: 'aspect-8/11 sm:aspect-video' },
    },
    // Where the title sits on the image: at the bottom, where devices that
    // can hover only reveal it on hover, or always visible and, from sm up,
    // centered over a darkened image. Both only apply with an image (see the
    // compounds below).
    titlePosition: {
      bottom: {},
      center: {},
    },
    size: {
      md: {
        title: 'text-xl md:text-2xl xl:text-3xl',
        label: 'mb-0.5 text-sm xl:text-base',
      },
      lg: {
        title: 'text-3xl sm:text-5xl md:text-6xl xl:text-7xl',
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
    {
      hasImage: true,
      titlePosition: 'center',
      className: {
        overlay:
          'sm:inset-0 sm:flex sm:items-center sm:justify-center sm:bg-black/25 sm:bg-none sm:p-16 sm:text-center',
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
// Home and Container). A full width card fills the viewport up to its max
// width.
export const CARD_IMAGE: Record<CardWidth, { width: number; sizes: string }> = {
  half: {
    width: 1170,
    sizes:
      '(min-width: 100rem) 41.25rem, (min-width: 90.9375rem) calc(50vw - 8.75rem), (min-width: 48rem) calc(50vw - 6.75rem), calc(100vw - 4rem)',
  },
  full: {
    width: 2560,
    sizes: '(min-width: 100rem) 100rem, 100vw',
  },
}
