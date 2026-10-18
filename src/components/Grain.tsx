import { cn } from '../lib/cn'

// Film grain on the background of the site: a tile of noise repeated over
// the screen, which jitters a step at a time (see the styles). Only the
// movement is an animation, so the grain stays with reduced motion.
//
// The negative z-index puts it above the background of what it is in and
// below everything else there, so images and cards cover it. Anything with
// a background of its own that covers the page hides the grain of the page
// as well, and holds a grain of its own instead. That has to be a stacking
// context for the grain to stay within it.
//
// It reaches past the screen by as far as it is moved, so an edge of it
// never shows.
export default function Grain({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed -inset-12 -z-1 bg-[url(/images/grain.png)] opacity-[0.05] motion-safe:animate-grain motion-safe:will-change-transform',
        className,
      )}
      aria-hidden="true"
    />
  )
}
