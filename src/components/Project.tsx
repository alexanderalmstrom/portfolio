import { Fragment, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { useProjects, useSpace } from '../hooks/queries'
import { firstImageBlock } from '../lib/blocks'
import { cn } from '../lib/cn'
import type { ProjectEntry } from '../types/contentful'

import Container from './Container'
import DocumentMeta from './DocumentMeta'
import Loading from './Loading'
import NotFound from './NotFound'
import Block from './Block'
import Card from './Card'

// A card that links on to another project, and the classes it adds to
// those of the card (see Links).
interface ProjectLink {
  entry: ProjectEntry
  label: string
  classNames: { root: string; media: string }
}

// How much of a card has to show in the row for it to be the current one.
const HALF = 0.5

// Seconds between each word starting to rise.
const STAGGER = 0.08

// The project name rises word by word, each through a mask of its own, the
// same way the heading of a hero does (see Hero).
function Title({ children }: { children: string }) {
  const words = children.trim().split(/\s+/)

  return (
    <header className="mt-10 w-full flex-none px-8 sm:text-center">
      <h1 className="mb-0 xl:text-8xl" aria-label={words.join(' ')}>
        {words.map((word, index) => (
          <Fragment key={index}>
            <span
              aria-hidden="true"
              className="-mb-[0.15em] inline-block overflow-hidden pb-[0.15em] align-bottom">
              <span
                className="inline-block motion-safe:animate-rise"
                style={{ animationDelay: `${index * STAGGER}s` }}>
                {word}
              </span>
            </span>{' '}
          </Fragment>
        ))}
      </h1>
    </header>
  )
}

// The cards of the previous and the next project, which end the page. The
// space above them is as much as the footer of the site leaves below them
// (see Footer), and the last block above adds nothing to it (see below).
//
// The cards run from edge to edge on small screens. There each takes nearly
// all of the width, in a row that scrolls sideways, so the next project
// shows with the edge of the previous one to the left of it. The row is
// reversed, which makes it start out scrolled to its right end, and the
// order of the previous project puts it back on the left.
//
// From sm up the two share the width of a row that is as tall as two
// portrait cards side by side are, and the one that is hovered takes some
// of the width of the other. The side padding is that of the container and
// of an image column together (see Container and Image), which keeps the
// cards clear of the site title and in line with the images above them.
//
// A project that is the only other one is both the previous and the next,
// and gets the whole width.
//
// A card of a pair is nearly as wide as a small screen, where it is half
// of the row from sm up, so its title is set larger there than the size of
// the card has it.
//
// On small screens there is no hovering, so there the card that shows the
// most of itself in the row is the one that stands out, the way the hovered
// one does from sm up: its image is zoomed in a little and the other one is
// dimmed, by more than a card that is not hovered is, as only its edge
// shows. That is the next project to begin with, and whichever card takes
// up more than half of the row once it is scrolled. The classes are
// important, as a small screen that can hover dims every card that is not
// hovered by less (see the card variants).
function Links({ links, isPair }: { links: ProjectLink[]; isPair: boolean }) {
  const row = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState('Next project')

  useEffect(() => {
    if (!row.current || !isPair) return

    const cards = [...row.current.children]

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio < HALF) continue

          setCurrent(links[cards.indexOf(entry.target)].label)
        }
      },
      { root: row.current, threshold: HALF },
    )

    cards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [links, isPair])

  return (
    <footer className="mx-auto max-w-400 pt-10 sm:pr-16 sm:pl-38">
      <div
        ref={row}
        className={cn(
          'flex max-sm:snap-x max-sm:snap-mandatory max-sm:scrollbar-none max-sm:flex-row-reverse max-sm:overflow-x-auto max-sm:overscroll-x-contain',
          isPair && 'sm:aspect-16/11',
        )}>
        {links.map(({ entry, label, classNames }) => (
          <Card
            key={label}
            to={`/project/${entry.fields.slug}`}
            title={entry.fields.name}
            label={label}
            image={entry.fields.image}
            width={isPair ? 'pair' : 'full'}
            aspect={isPair ? 'portrait' : 'landscape'}
            titlePosition="center"
            size={isPair ? 'md' : 'lg'}
            classNames={{
              ...classNames,
              title: cn(isPair && 'max-sm:text-4xl'),
              media: cn(
                classNames.media,
                isPair &&
                  (label == current
                    ? 'max-sm:[&_img]:scale-105! max-sm:[&_img]:opacity-100!'
                    : 'max-sm:[&_img]:opacity-50!'),
              ),
            }}
          />
        ))}
      </div>
    </footer>
  )
}

export default function Project() {
  const { slug } = useParams()
  const { data: projects = [], isPending } = useProjects()
  const { data: space } = useSpace()

  if (isPending) return <Loading />

  const index = projects.findIndex((entry) => entry.fields.slug === slug)
  const entry = projects[index]

  if (!entry) return <NotFound />

  // Projects are ordered by date, and they wrap around: the last one links
  // on to the first and the first one back to the last.
  const previous = projects[(index || projects.length) - 1]
  const next = projects[(index + 1) % projects.length]
  const hasNext = next !== entry

  // With only two projects the previous one is the next one as well. The
  // classes of the root are for the row the two scroll in on small screens
  // (see below). Those of the media hold each image to the outer edge of
  // its card from sm up, so it stays in place as the card grows.
  const isPair = hasNext && previous !== next
  const links: ProjectLink[] = [
    ...(isPair
      ? [
          {
            entry: previous,
            label: 'Previous project',
            classNames: {
              root: 'max-sm:order-1 max-sm:snap-start',
              media: 'sm:[&_picture]:left-0',
            },
          },
        ]
      : []),
    ...(hasNext
      ? [
          {
            entry: next,
            label: 'Next project',
            classNames: {
              root: 'max-sm:snap-end',
              media: 'sm:[&_picture]:right-0',
            },
          },
        ]
      : []),
  ]

  const { blocks } = entry.fields
  const eagerBlock = firstImageBlock(blocks)

  // Going from one project to the next keeps this component mounted. The key
  // makes the page mount again, so its animations run as on a first visit.
  // An image that is about to slide in reaches past the right edge of a
  // small screen, which is cut off here so the page cannot scroll sideways.
  // The negative margin cancels the bottom padding of main (see Layout), so
  // the cards end the page.
  return (
    <article
      key={entry.sys.id}
      className={cn('overflow-x-clip', hasNext ? '-mb-6' : 'sm:mb-10')}>
      <Container>
        <DocumentMeta
          title={`${entry.fields.name} - ${space?.name}`}
          description={entry.fields.description}
        />
        <Title>{entry.fields.name}</Title>
        {/* The last block gives up its bottom margin when cards follow,
              which keep their own distance to it (see Links). */}
        <section className={cn('w-full flex-none', hasNext && '*:last:mb-0')}>
          {blocks
            ? blocks.map((entry, index) => {
                // The first images are near the top of the page, so they
                // should not wait for lazy loading.
                return (
                  <Block
                    key={index}
                    entry={entry}
                    loading={index == eagerBlock ? 'eager' : 'lazy'}
                    rise
                    slide
                  />
                )
              })
            : null}
        </section>
      </Container>
      {hasNext ? <Links links={links} isPair={isPair} /> : null}
    </article>
  )
}
