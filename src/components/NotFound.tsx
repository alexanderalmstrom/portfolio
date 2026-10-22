import {
  Fragment,
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { cn } from '../lib/cn'
import { holdCover } from '../lib/cover'

import Container from './Container'

// The sky is by far the largest part of the site and only this page shows
// it, so it is loaded when the page is. The page stays covered until the
// sky has been drawn.
const Starfield = lazy(() => import('./Starfield'))

// How long the page stays covered at most, in milliseconds, should the sky
// never get there.
const PATIENCE = 8000

// How far the text goes of the way the earth gives to the pointer, or to
// the tilt of a phone. It goes the same way and a little further, as it is
// in front of the earth, the way the moon behind it goes less far.
const NEAR = 1.4

// Safari on a phone only tells how it is tilted once the visitor has
// allowed it to, which it has to be asked for.
interface TiltPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

function tiltPermission() {
  return (
    'DeviceOrientationEvent' in window ? DeviceOrientationEvent : {}
  ) as TiltPermission
}

interface GlitchProps {
  children: ReactNode
}

interface Noise {
  // Which readout is showing garbage.
  index: number
  text: string
}

// A copy of the text of which only a horizontal slice shows, pushed
// sideways, so that the letters double up there with a fringe of colour:
// the misaligned colour channel. It has no background of its own, which
// would show as a dark bar across the sky behind the text.
const slice =
  'pointer-events-none absolute inset-0 hidden select-none motion-safe:block'

// Text that breaks up in short bursts, like a screen losing its signal.
function Glitch({ children }: GlitchProps) {
  return (
    <span className="relative block motion-safe:animate-glitch-shake">
      {children}
      <span
        aria-hidden="true"
        className={cn(
          slice,
          'animate-glitch-top [text-shadow:-0.02em_0_#f0f]',
        )}>
        {children}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          slice,
          'animate-glitch-bottom [text-shadow:0.02em_0_#0ff]',
        )}>
        {children}
      </span>
    </span>
  )
}

// Seconds between the readouts, each line of the heading and the text
// under it starting to rise when the page opens.
const STAGGER = 0.08

const NOISE = '#%&/<>?*=+'

// The readouts that can come through as garbage, by their place in the
// row. The signal between them always reads as a percentage.
const CLOCK = 0
const SENSOR = 2

// What the oxygen sensor sends when it answers at all: nothing readable.
const CIPHER = '0123456789ABCDEFXZ#$&@?'

function scramble(characters: string, length: number) {
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)],
  ).join('')
}

function clock(seconds: number) {
  return [seconds / 3600, (seconds / 60) % 60, seconds % 60]
    .map((part) => String(Math.floor(part)).padStart(2, '0'))
    .join(':')
}

// Where the mission clock starts, in seconds: at 04:04.
const START = 4 * 60 + 4

// What the signal can read, in percent: the digits of a 404.
const LEVELS = [0, 4]

interface RollProps {
  value: string
}

// A character that rolls over to the next one when it changes, like a digit
// on a mechanical clock: the new one comes down from above and pushes the
// old one out at the bottom, behind a mask one line high.
function Roll({ value }: RollProps) {
  const [shown, setShown] = useState({ value, before: value })

  // Keep what was shown last, to have something to roll out.
  if (shown.value != value) setShown({ value, before: shown.value })

  const changed = shown.before != shown.value

  return (
    <span className="relative inline-block h-[1lh] overflow-hidden align-bottom">
      <span
        key={shown.value}
        className={cn('block', changed && 'motion-safe:animate-roll-in')}>
        {shown.value}
      </span>
      {changed ? (
        <span
          key={`out-${shown.before}`}
          className="absolute inset-0 hidden motion-safe:block motion-safe:animate-roll-out">
          {shown.before}
        </span>
      ) : null}
    </span>
  )
}

// Readouts from the mission that lost the page. The clock keeps running
// and the signal barely gets through, both rolling over like a mechanical
// counter, the oxygen sensor answers in code, and now and then one of the
// values comes through as garbage.
function Telemetry() {
  const [seconds, setSeconds] = useState(START)
  const [signal, setSignal] = useState(0)
  const [oxygen, setOxygen] = useState('--')
  const [noise, setNoise] = useState<Noise | null>(null)

  useEffect(() => {
    const tick = setInterval(() => {
      setSeconds((seconds) => seconds + 1)
      // Mostly nothing gets through, sometimes a trace of a signal, and
      // sometimes a code from the oxygen sensor. The signal only ever reads
      // 4 or 0, the digits of a 404.
      setSignal(Math.random() < 0.3 ? LEVELS[1] : LEVELS[0])
      setOxygen(Math.random() < 0.25 ? scramble(CIPHER, 2) : '--')
    }, 1000)

    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Interference starts on the clock or the sensor now and then, and
    // usually stays on it for a few moments with the garbage changing all
    // the while.
    const interference = setInterval(() => {
      setNoise((noise) =>
        Math.random() < (noise ? 0.7 : 0.05)
          ? {
              index: noise?.index ?? (Math.random() < 0.5 ? CLOCK : SENSOR),
              text: scramble(NOISE, 8),
            }
          : null,
      )
    }, 140)

    return () => clearInterval(interference)
  }, [])

  const readouts = [
    ['T+', clock(seconds)],
    ['Signal', `${signal}%`],
    ['O2', oxygen],
  ]

  return (
    <p className="mb-8 tracking-[0.2em] uppercase motion-safe:animate-glitch-flicker max-sm:text-xs">
      {/* The first thing to rise in, through a mask of its own. */}
      <span className="block overflow-hidden">
        <span className="flex flex-wrap gap-y-1 motion-safe:animate-rise sm:gap-x-6">
          <span className="max-sm:basis-1/2">Error 404</span>
          {readouts.map(([name, value], index) => (
            <span key={name} className="max-sm:basis-1/2" aria-hidden="true">
              {name}{' '}
              {noise?.index == index
                ? noise.text.slice(0, value.length)
                : name == 'O2'
                  ? value
                  : // The clock and the signal roll over digit by digit.
                    [...value].map((character, place) =>
                      /\d/.test(character) ? (
                        <Roll key={place} value={character} />
                      ) : (
                        character
                      ),
                    )}
            </span>
          ))}
        </span>
      </span>
    </p>
  )
}

// What the crew of Apollo 13 actually said.
const lines = ["Houston, we've had", 'a problem here.']

// The heading rises into place when the page opens, like the heading of a
// hero, through masks whose padding keeps descenders from being cut. From
// sm and up it rises line by line. On a phone the lines wrap and the type
// is small, which makes that hard to see, so there it rises word by word.
function Heading() {
  let place = 0

  return lines.map((line, index) => (
    <span
      key={index}
      className="mb-[-0.15em] block pb-[0.15em] sm:overflow-hidden">
      <span
        className="block sm:motion-safe:animate-rise"
        style={{ animationDelay: `${(index + 1) * STAGGER}s` }}>
        {line.split(' ').map((word, index) => {
          place += 1

          return (
            <Fragment key={index}>
              {index > 0 ? ' ' : null}
              <span className="inline-block max-sm:mb-[-0.15em] max-sm:overflow-hidden max-sm:pb-[0.15em] max-sm:align-bottom">
                <span
                  className="inline-block max-sm:motion-safe:animate-rise"
                  style={{ animationDelay: `${place * STAGGER}s` }}>
                  {word}
                </span>
              </span>
            </Fragment>
          )
        })}
      </span>
    </span>
  ))
}

interface MotionProps {
  // Whether the page gives way to the tilt of the phone.
  on: boolean
  onChange: (on: boolean) => void
}

// The switch that turns the tilt of the phone on and off, which the sky
// and the text give way to (see Starfield). Safari only tells the tilt once
// the visitor has allowed it to. It only lets itself be asked from a tap,
// and only a tap on something that is there to be tapped is sure to count
// as one, so turning the switch on is what asks. It is on already when the
// tilt is told without asking, as it is for the rest of a visit that it has
// been allowed in. A visitor who turns the question down is told so, and
// the switch stays off, as Safari does not ask twice.
//
// The switch is a track of frosted glass, which the sky shows through
// blurred, with a knob that goes across it and from white to green. It is
// shown on what can tell its tilt: a screen without a pointer to hover
// with, with motion that is not reduced, in a browser that either wants to
// be asked for the tilt or tells it without, which is known once it has.
// So a phone that is not Safari gets the switch, turned on, a moment into
// the page. What the screen can do is only known in the browser, so a page
// rendered on the server leaves the switch out until the browser has taken
// over.
function Motion({ on, onChange }: MotionProps) {
  const [mobile, setMobile] = useState(false)
  const [answer, setAnswer] = useState<'granted' | 'denied' | null>(null)

  useEffect(() => {
    setMobile(
      window.matchMedia('(hover: none)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
  }, [])

  useEffect(() => {
    if (!mobile || answer) return

    function told(event: DeviceOrientationEvent) {
      if (event.beta != null) setAnswer('granted')
    }

    window.addEventListener('deviceorientation', told)

    return () => window.removeEventListener('deviceorientation', told)
  }, [mobile, answer])

  // Something that can tell its tilt either wants to be asked for it or
  // has told it.
  if (!mobile || !(tiltPermission().requestPermission || answer)) return null

  const enabled = answer == 'granted' && on

  return (
    <p className="mt-6 mb-0 overflow-hidden text-xs">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        className="group/motion flex cursor-pointer items-center gap-3 py-2 tracking-[0.2em] uppercase disabled:cursor-default motion-safe:animate-rise"
        style={{ animationDelay: `${(lines.length + 2) * STAGGER}s` }}
        disabled={answer == 'denied'}
        onClick={() => {
          if (answer == 'granted') return onChange(!on)

          tiltPermission()
            .requestPermission?.()
            .then((answer) => {
              setAnswer(answer)
              if (answer == 'granted') onChange(true)
            })
            .catch(() => {})
        }}>
        <span className="flex h-7 w-12 flex-none items-center rounded-full bg-white/15 p-1 backdrop-blur-md backdrop-saturate-150">
          <span className="size-5 rounded-full bg-white transition-[translate,background-color] duration-300 ease-out group-aria-checked/motion:translate-x-full group-aria-checked/motion:bg-[#30d158]" />
        </span>
        {answer == 'denied'
          ? 'Motion not allowed'
          : enabled
            ? 'Motion enabled'
            : 'Enable motion'}
      </button>
    </p>
  )
}

export default function NotFound() {
  // Space is dark whatever theme the visitor prefers, so the whole site
  // goes dark for as long as this page is shown, along with the colour the
  // browser gives its own bars on the light theme.
  useLayoutEffect(() => {
    const bars = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][media]',
    )
    const colour = bars?.content

    document.documentElement.dataset.theme = 'dark'
    if (bars) bars.content = '#000000'

    return () => {
      delete document.documentElement.dataset.theme
      if (bars && colour) bars.content = colour
    }
  }, [])

  // Setting the sky up takes long enough to make anything that moves
  // stutter, and it is not much to look at until its maps are there. So the
  // cover between two pages is held until all of it has been drawn, and
  // the page is uncovered with its sky in place.
  const uncover = useRef<() => void>(undefined)

  useLayoutEffect(() => {
    const release = holdCover()
    const timeout = setTimeout(release, PATIENCE)

    uncover.current = release

    return () => {
      clearTimeout(timeout)
      release()
    }
  }, [])

  const text = useRef<HTMLDivElement>(null)
  // Whether the page gives way to the tilt of a phone, which the visitor
  // can turn off (see Motion).
  const [tilts, setTilts] = useState(true)

  return (
    <Container className="mt-10">
      <Suspense>
        <Starfield
          className="pointer-events-none fixed inset-0 -z-1 size-full"
          onReady={() => uncover.current?.()}
          tilts={tilts}
          onSway={(right, down) => {
            if (!text.current) return

            text.current.style.translate = `${right * NEAR}px ${down * NEAR}px`
          }}
        />
      </Suspense>
      {/* The text is moved out of its place as the pointer moves, or as a
          phone is tilted (see Starfield), which would make the page scroll, sideways on a narrow
          screen. So it is cut off at the edges of the page, and at a
          distance above and below itself that it never gets to. The
          attribute tells the layout that the page has a sky behind it,
          which fills the screen (see Layout). */}
      <div className="-my-16 w-full flex-none overflow-clip py-16" data-sky="">
        {/* Everything but the heading is set in the typeface of the
            readouts. The heading grows with the width of the screen. */}
        <div
          ref={text}
          className="px-8 font-mono text-[0.8125rem] will-change-transform lg:px-16">
          <Telemetry />
          <h1 className="mb-6 font-sans text-[clamp(2.25rem,6vw,8rem)] leading-[1.05]">
            <Glitch>
              <Heading />
            </Glitch>
          </h1>
          <p className="motion-safe:animate-glitch-flicker motion-safe:[animation-delay:-1.7s] lg:text-lg">
            {/* Rises in after the heading, through a mask of its own; the
              padding keeps descenders from being cut. */}
            <span className="mb-[-0.15em] block overflow-hidden pb-[0.15em]">
              <span
                className="block motion-safe:animate-rise"
                style={{ animationDelay: `${(lines.length + 1) * STAGGER}s` }}>
                We could not find what you were looking for.
              </span>
            </span>
          </p>
          <Motion on={tilts} onChange={setTilts} />
        </div>
      </div>
    </Container>
  )
}
