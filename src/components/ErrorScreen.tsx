import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

import { isApple } from '../services/helpers'

import BlueScreen from './BlueScreen'
import SadMac from './SadMac'

// What the site shows when something it needs cannot be loaded, in the
// style of the system it is visited on. Restarting loads it all again.
export default function ErrorScreen({ reset }: ErrorComponentProps) {
  const router = useRouter()
  const { reset: resetQueries } = useQueryErrorResetBoundary()

  const onRestart = () => {
    resetQueries()
    reset()
    router.invalidate()
  }

  return isApple() ? (
    <SadMac onRestart={onRestart} />
  ) : (
    <BlueScreen onRestart={onRestart} />
  )
}
