import { useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'

import { usePage } from '../hooks/queries'
import { HEADINGS, useRiseLines } from '../hooks/useRiseLines'
import { firstImageBlock } from '../lib/blocks'
import { PAGE_IMAGE } from '../lib/grid'
import { markdown } from '../services/markdown'

import Block from './Block'
import Container from './Container'
import NotFound from './NotFound'
import ImageContentful from './ImageContentful'

const route = getRouteApi('/page/$slug')

// The title and the text of a page, which come in the way the text of a
// column does (see Column). It is a component of its own so the lines are
// split when the text is there, which it is not yet when the page itself
// mounts.
function Text({ title, text }: { title?: string; text?: string }) {
  // Kept between renders, so React leaves the split lines alone.
  const html = useMemo(() => markdown(text), [text])
  const ref = useRiseLines<HTMLDivElement>(HEADINGS)

  return (
    <div
      ref={ref}
      className="w-full flex-none px-8 md:w-6/12 lg:w-8/12 lg:px-16"
      data-rise-lines="">
      {title ? <h1>{title}</h1> : null}
      <div className="text-foreground/60" dangerouslySetInnerHTML={html} />
    </div>
  )
}

// The route has loaded the page and made sure there is one, as well as
// given it its title (see routes/page.$slug).
export default function Page() {
  const { slug } = route.useParams()
  const { data: entry } = usePage(slug)

  if (!entry?.fields) return <NotFound />

  // The first images on the page should not wait for lazy loading. That is
  // the header image unless a block above it shows one.
  const eagerBlock = firstImageBlock(entry.fields.blocks)

  return (
    <article className="-mt-25 sm:mt-0 sm:mb-10">
      <Container>
        {entry.fields.blocks?.length ? (
          <section className="w-full flex-none">
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
          <Text title={entry.fields.title} text={entry.fields.text} />
        </header>
      </Container>
    </article>
  )
}
