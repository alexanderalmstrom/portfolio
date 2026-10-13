// What the Contentful delivery API returns, written out for the content
// model of this site. Links are resolved by the time anything is typed as
// one of these (see resolveLinks), and a link to something that is not
// published is left out.

export interface Space {
  name: string
}

export interface Entry<ContentTypeId extends string, Fields> {
  sys: {
    id: string
    type: 'Entry'
    contentType: { sys: { id: ContentTypeId } }
  }
  fields: Fields
}

export interface ImageAsset {
  sys: {
    id: string
    type: 'Asset'
  }
  fields: {
    title?: string
    description?: string
    // An image or a video.
    file?: {
      url: string
      fileName: string
      contentType: string
      details: {
        size: number
        // Only images have dimensions.
        image?: { width: number; height: number }
      }
    }
  }
}

export type ColumnEntry = Entry<
  'column',
  {
    content?: string
    size?: number
  }
>

export type ImageEntry = Entry<
  'image',
  {
    image?: ImageAsset
    size?: number
  }
>

export type ContentBlockEntry = Entry<
  'content_block',
  {
    columns?: (ColumnEntry | ImageEntry)[]
  }
>

export type HeroEntry = Entry<
  'hero',
  {
    // An image or a video.
    asset?: ImageAsset
    heading?: string
  }
>

export type BlockEntry = ContentBlockEntry | HeroEntry

export type ProjectEntry = Entry<
  'project',
  {
    name: string
    slug: string
    date?: string
    description?: string
    image?: ImageAsset
    blocks?: BlockEntry[]
  }
>

export type PageEntry = Entry<
  'page',
  {
    name: string
    slug: string
    title?: string
    description?: string
    text?: string
    image?: ImageAsset
    blocks?: BlockEntry[]
  }
>

type AnyEntry = Entry<string, unknown>

// The content type sits too deep in an entry for TypeScript to narrow a
// union of entries by it, so this does.
export function isEntryOf<
  Candidate extends AnyEntry,
  ContentTypeId extends Candidate['sys']['contentType']['sys']['id'],
>(
  entry: Candidate,
  contentTypeId: ContentTypeId,
): entry is Extract<Candidate, Entry<ContentTypeId, unknown>> {
  return entry.sys.contentType.sys.id === contentTypeId
}
