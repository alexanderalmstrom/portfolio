import { useEffect } from 'react'
import type { ComponentType } from 'react'
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  ScrollRestoration,
} from 'react-router-dom'

import { useSpace } from '../hooks/queries'
import { createEvent, isApple } from '../services/helpers'

import Layout from './Layout'
import Loading from './Loading'
import BlueScreen from './BlueScreen'
import NotFound from './NotFound'
import Home from './Home'
import PageTransition from './PageTransition'
import SadMac from './SadMac'

const appLoadedEvent = createEvent('APP_LOADED')

const ErrorScreen = isApple() ? SadMac : BlueScreen

// ScrollRestoration scrolls to the top on a new navigation and back to where
// the visitor was on back and forward. It needs a data router to work.
function Root() {
  return (
    <Layout>
      <Outlet />
      <ScrollRestoration />
      <PageTransition />
    </Layout>
  )
}

// A project or a page is loaded when it is first opened, along with what
// only they use. The page that is showing stays until the next one is ready.
function lazyRoute(load: () => Promise<{ default: ComponentType }>) {
  return () => load().then((module) => ({ Component: module.default }))
}

const router = createBrowserRouter([
  {
    element: <Root />,
    // Shown when the site is opened on a project or a page.
    hydrateFallbackElement: <Loading />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/project/:slug', lazy: lazyRoute(() => import('./Project')) },
      { path: '/page/:slug', lazy: lazyRoute(() => import('./Page')) },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  const { status, refetch } = useSpace()

  useEffect(() => {
    if (status == 'success') {
      document.dispatchEvent(appLoadedEvent)
    }
  }, [status])

  return (
    <div>
      {status == 'error' ? <ErrorScreen onRestart={() => refetch()} /> : null}
      {status == 'success' ? <RouterProvider router={router} /> : null}
      {status == 'pending' ? <Loading /> : null}
    </div>
  )
}
