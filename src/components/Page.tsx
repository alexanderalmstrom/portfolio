import { useParams } from 'react-router-dom'

import { usePage, useSpace } from '../hooks/queries'
import { firstImageBlock } from '../lib/blocks'
import { PAGE_IMAGE } from '../lib/grid'
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
                <ImageContentful
                  image={entry.fields.image}
                  width={PAGE_IMAGE.width}
                  sizes={PAGE_IMAGE.sizes}
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
