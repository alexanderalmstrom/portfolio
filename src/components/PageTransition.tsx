import { useEffect, useState } from 'react'
import type { AnimationEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useBlocker } from 'react-router-dom'
import type { BlockerFunction } from 'react-router-dom'

import { cn } from '../lib/cn'
import { prefetchPage } from '../lib/prefetch'

import Loading from './Loading'

// How long the cover stays in place, in milliseconds, so the triangle on it
// is seen to turn.
const HOLD = 400

// Going from one page to another is held back for the cover to come in,
// whether a link was followed or the visitor went back or forward. Not with
// reduced motion, where the next page just shows.
const isToAnotherPage: BlockerFunction = ({ currentLocation, nextLocation }) =>
  currentLocation.pathname != nextLocation.pathname &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches

// Hides the page that is left and uncovers the one that is opened. A cover
// with the loading triangle on it comes in from below until it fills the
// screen, the page behind it is swapped for the next one, and the cover
// goes on up and out at the top. The cover is clipped rather than
// moved, so the triangle stays in the middle of the screen throughout.
export default function PageTransition() {
  const blocker = useBlocker(isToAnotherPage)
  const [stage, setStage] = useState<'idle' | 'covered' | 'leaving'>('idle')

  const queryClient = useQueryClient()

  const isEntering = stage == 'idle' && blocker.state == 'blocked'
  const next = blocker.location?.pathname

  // The next page is not there until the cover is in place, so the time the
  // cover takes to come in is used to get its code, its content and its
  // first images ready. Going there does not wait for any of it.
  useEffect(() => {
    if (next) prefetchPage(next, queryClient).catch(() => {})
  }, [next, queryClient])

  // The next page is let through after the hold, and the cover leaves once
  // it is there, which can take a while the first time a project or a page
  // is opened (see App). It mounts as the cover starts to leave.
  useEffect(() => {
    if (stage != 'covered') return

    if (blocker.state == 'unblocked') {
      setStage('leaving')
      return
    }

    if (blocker.state != 'blocked') return

    const timeout = setTimeout(blocker.proceed, HOLD)

    return () => clearTimeout(timeout)
  }, [stage, blocker])

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

  return (
    <div
      className={cn(
        'fixed inset-0 z-2000 bg-background',
        isEntering && 'animate-cover',
        stage == 'leaving' && 'animate-uncover',
        stage == 'idle' && !isEntering && 'invisible',
      )}
      aria-hidden="true"
      onAnimationEnd={onAnimationEnd}>
      <Loading />
    </div>
  )
}
