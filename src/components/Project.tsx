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
        <header className="mt-10 w-full flex-none px-8 motion-safe:animate-settle sm:text-center">
          <h1 className="mb-0 xl:text-8xl">{entry.fields.name}</h1>
        </header>
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
