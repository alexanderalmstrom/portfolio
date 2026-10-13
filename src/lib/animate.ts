import { cn } from './cn'

// Content starts transparent and fades in once loaded. With rise it also
// starts shifted down and moves up into place.
export function animateIn(isLoaded: boolean, rise = false) {
  return cn(
    'transition-[translate,opacity] duration-600',
    isLoaded ? 'opacity-100' : 'opacity-0',
    rise && (isLoaded ? 'translate-y-0' : 'translate-y-5'),
  )
}
