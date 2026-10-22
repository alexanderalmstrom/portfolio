import { createIsomorphicFn } from '@tanstack/react-start'

// Gets the sky of the not found page ready ahead of going there: its code
// and the maps it is drawn from. Only in the browser, which is where the sky
// is drawn.
export const prefetchSky = createIsomorphicFn().client(() => {
  import('../components/Starfield')
    .then(({ preloadMaps }) => preloadMaps())
    .catch(() => {})
})
