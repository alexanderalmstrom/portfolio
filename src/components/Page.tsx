import { useParams } from 'react-router-dom'

import { usePage, useSpace } from '../hooks/queries'
import { firstImageBlock } from '../lib/blocks'
import { markdown } from '../services/markdown'

import Block from './Block'
import Container from './Container'
import DocumentMeta from './DocumentMeta'
import NotFound from './NotFound'
import Loading from './Loading'
import ImageContentful from './ImageContentful'

export default function Page() {
  const { slug } = useParams()
  const { data: entry, isPending, isError } = usePage(slug)
  const { data: space } = useSpace()

  if (isError) return <NotFound />

  if (isPending) return <Loading />

  // The first images on the page should not wait for lazy loading. That is
  // the header image unless a block above it shows one.
  const eagerBlock = firstImageBlock(entry.fields?.blocks)

  return (
    <article className="-mt-25 sm:mt-0 sm:mb-10">
      {entry.fields ? (
        <Container>
          <DocumentMeta
            title={`${entry.fields.name} - ${space?.name}`}
            description={entry.fields.description}
          />
          {entry.fields.blocks?.length ? (
            <section className="w-full flex-none [&_ul]:list-none [&_ul]:pl-0">
              {entry.fields.blocks.map((entry, index) => {
                return (
                  <Block
                    key={index}
                    entry={entry}
                    loading={index == eagerBlock ? 'eager' : 'lazy'}
                  />
                )
              })}
            </section>
          ) : null}
          <header className="flex w-full flex-row-reverse flex-wrap items-start gap-y-8 sm:gap-y-16">
            {entry.fields.image ? (
              <div className="w-full flex-none sm:mb-0 sm:px-32 md:w-6/12 md:px-16 lg:w-4/12 xl:px-16">
                {/* The full container from sm, half from md and a third from
                    lg, minus the column's side padding (see lib/grid). */}
                <ImageContentful
                  image={entry.fields.image}
                  width={800}
                  sizes="(min-width: 100rem) 22.17rem, (min-width: 75rem) calc(33.33vw - 11.17rem), (min-width: 62rem) calc(50vw - 12.75rem), (min-width: 48rem) calc(100vw - 25.5rem), 100vw"
                  loading={eagerBlock == -1 ? 'eager' : 'lazy'}
                />
              </div>
            ) : null}
            <div className="w-full flex-none px-8 motion-safe:animate-settle md:w-6/12 lg:w-8/12 lg:px-16">
              {entry.fields.title ? <h1>{entry.fields.title}</h1> : null}
              <div dangerouslySetInnerHTML={markdown(entry.fields.text)} />
            </div>
          </header>
        </Container>
      ) : (
        <NotFound />
      )}
    </article>
  )
}
