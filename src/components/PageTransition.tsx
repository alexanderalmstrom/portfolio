import { useEffect, useState, useSyncExternalStore } from 'react'
import type { AnimationEvent } from 'react'
import { useBlocker, useRouter, useRouterState } from '@tanstack/react-router'
import type { ShouldBlockFn } from '@tanstack/react-router'

import { cn } from '../lib/cn'
import { isCoverHeld, onCoverHeld } from '../lib/cover'
import { prefetchSky } from '../lib/prefetch'

import Grain from './Grain'
import Loading from './Loading'

// Going from one page to another is held back for the cover to come in,
// whether a link was followed or the visitor went back or forward. Not with
// reduced motion, where the next page just shows.
const isToAnotherPage: ShouldBlockFn = ({ current, next }) =>
  current.pathname != next.pathname &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches

// Nothing holds the cover on the server, which renders it out of the way.
const isCoverHeldOnServer = () => false

// Hides the page that is left and uncovers the one that is opened. A cover
// with the loading triangle on it comes in from below until it fills the
// screen, the page behind it is swapped for the next one, and the cover
// goes on up and out at the top. The cover is clipped rather than
// moved, so the triangle stays in the middle of the screen throughout.
//
// The next page can hold the cover while it gets something ready (see
// lib/cover). A page that does so when it is opened directly, with no
// cover up, is covered at once and uncovered the same way. On a page
// rendered on the server, that is the not found page with its sky, which
// is covered from the start (see the classes below).
export default function PageTransition() {
  const router = useRouter()
  const blocker = useBlocker({
    shouldBlockFn: isToAnotherPage,
    enableBeforeUnload: false,
    withResolver: true,
  })
  const [stage, setStage] = useState<'idle' | 'covered' | 'leaving'>('idle')

  // The page the cover was let through to, until it is there.
  const [opening, setOpening] = useState<string>()
  const shown = useRouterState({
    select: (state) =>
      state.status == 'idle' ? state.resolvedLocation?.pathname : undefined,
  })

  const held = useSyncExternalStore(
    onCoverHeld,
    isCoverHeld,
    isCoverHeldOnServer,
  )

  const isEntering = stage == 'idle' && blocker.status == 'blocked'
  const next = blocker.next?.pathname

  // The next page is not there until the cover is in place, so the time the
  // cover takes to come in is used to get its code, its content and its
  // first images ready, which its route decides on (see the routes). Going
  // there does not wait for any of it. A path that leads nowhere gets the
  // sky of the not found page ready instead. Going there keeps ?preview, so
  // getting it ready does as well (see the root route).
  useEffect(() => {
    if (!next) return

    const [, , foundRoute] = router.getMatchedRoutes(next)

    if (!foundRoute) {
      prefetchSky()
      return
    }

    router.preloadRoute({ to: next }).catch(() => {})
  }, [next, router])

  // The next page is let through as soon as the cover is in place, and the
  // cover leaves once it is there, which can take a while the first time a
  // project or a page is opened. It mounts as the cover starts to leave,
  // unless it holds the cover, which then leaves when it is let go of. With
  // reduced motion the cover is only ever up for a page that holds it, and
  // is taken away without being seen to leave.
  useEffect(() => {
    if (stage == 'idle' && isCoverHeld() && blocker.status == 'idle') {
      setStage('covered')
      return
    }

    if (stage != 'covered') return

    if (blocker.status == 'blocked') {
      setOpening(blocker.next.pathname)
      blocker.proceed()
      return
    }

    if (opening && shown != opening) return

    // Asked for now, as the next page takes hold of the cover while it
    // mounts, which is after this was last rendered.
    if (isCoverHeld()) return

    setOpening(undefined)
    setStage(
      matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'idle'
        : 'leaving',
    )
  }, [stage, blocker, held, opening, shown])

  // The page that is uncovered waits with its animations until the cover
  // has left (see the styles), so text does not rise in behind it.
  useEffect(() => {
    if (stage == 'idle') return

    document.documentElement.dataset.covered = ''

    return () => {
      delete document.documentElement.dataset.covered
    }
  }, [stage])

  // The triangle never stops turning, so only the cover itself ends.
  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.target != event.currentTarget) return

    setStage(isEntering ? 'covered' : 'idle')
  }

  // Until the browser has taken over a page rendered on the server, the
  // cover is up on the not found page, which holds it from then on.
  return (
    <div
      className={cn(
        'fixed inset-0 z-2000 bg-background',
        isEntering && 'animate-cover',
        stage == 'leaving' && 'animate-uncover',
        stage == 'idle' && !isEntering && !held && 'invisible',
        '[:root:not([data-hydrated]):has([data-sky])_&]:visible',
      )}
      aria-hidden="true"
      onAnimationEnd={onAnimationEnd}>
      <Grain />
      <Loading />
    </div>
  )
}
