import { Fragment } from 'react'
import { useParams } from 'react-router-dom'

import { useProjects, useSpace } from '../hooks/queries'
import { firstImageBlock } from '../lib/blocks'
import { cn } from '../lib/cn'

import Container from './Container'
import DocumentMeta from './DocumentMeta'
import Loading from './Loading'
import NotFound from './NotFound'
import Block from './Block'
import Card from './Card'

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

export default function Project() {
  const { slug } = useParams()
  const { data: projects = [], isPending } = useProjects()
  const { data: space } = useSpace()

  if (isPending) return <Loading />

  const index = projects.findIndex((entry) => entry.fields.slug === slug)
  const entry = projects[index]

  if (!entry) return <NotFound />

  // Projects are ordered by date, and the last one links back to the first.
  const next = projects[(index + 1) % projects.length]
  const hasNext = next !== entry

  const { blocks } = entry.fields
  const eagerBlock = firstImageBlock(blocks)

  // Going from one project to the next keeps this component mounted. The key
  // makes the page mount again, so its animations run as on a first visit.
  return (
    <article key={entry.sys.id} className={cn(!hasNext && 'sm:mb-10')}>
      <Container>
        <DocumentMeta
          title={`${entry.fields.name} - ${space?.name}`}
          description={entry.fields.description}
        />
        <Title>{entry.fields.name}</Title>
        <section className="[&_ul]:list-none [&_ul]:pl-0">
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
                  />
                )
              })
            : null}
        </section>
      </Container>
      {/* Outside the container, so it is not held in by its side padding.
          On small screens the negative margin cancels the bottom margin
          of main (see Layout), so it ends the page. From sm up the bottom
          margin, which that of main collapses into, is the space the last
          block leaves above the card (see ContentBlock). */}
      {hasNext ? (
        <footer className="-mb-6 sm:mb-8 md:mt-16 md:mb-32">
          <Card
            key={next.sys.id}
            to={`/project/${next.fields.slug}`}
            title={next.fields.name}
            label="Next project"
            image={next.fields.image}
            width="full"
            aspect="landscape"
            titlePosition="center"
            size="lg"
          />
        </footer>
      ) : null}
    </article>
  )
}
