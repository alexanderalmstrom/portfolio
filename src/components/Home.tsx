import { useProjects, useSpace } from '../hooks/queries'

import DocumentMeta from './DocumentMeta'
import Loading from './Loading'
import Card from './Card'
import Container from './Container'

const DESCRIPTION =
  'Senior Frontend Engineer and UI/UX Designer from Stockholm, Sweden. I craft web and e-commerce solutions with attention to detail.'

export default function Home() {
  const { data: projects = [], isPending } = useProjects()
  const { data: space } = useSpace()

  return (
    <>
      <DocumentMeta
        title={`${space?.name} - Senior Frontend Engineer / Designer`}
        description={DESCRIPTION}
      />
      {isPending ? (
        <Loading />
      ) : (
        <section>
          <Container className="xl:mt-10">
            <div className="flex w-full flex-wrap gap-x-8 gap-y-8 px-8 sm:px-4 xl:mb-12 xl:gap-x-16 xl:gap-y-15 xl:px-8">
              {projects.map((entry, index) => {
                // The first row is above the fold, so it should not wait
                // for lazy loading.
                return (
                  <Card
                    key={index}
                    to={`/project/${entry.fields.slug}`}
                    title={entry.fields.name}
                    image={entry.fields.image}
                    loading={index < 2 ? 'eager' : 'lazy'}
                  />
                )
              })}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
