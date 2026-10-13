// Something the API returns in full: an entry or an asset.
interface Entity {
  sys: { id: string; type: string }
  fields: unknown
}

// The API returns the entries that were asked for in items and everything
// they link to, down to the requested depth, in includes.
export interface Collection {
  items: Entity[]
  includes?: {
    Entry?: Entity[]
    Asset?: Entity[]
  }
}

interface Link {
  sys: { type: 'Link'; linkType: string; id: string }
}

function isLink(value: object): value is Link {
  return 'sys' in value && (value.sys as Link['sys'] | null)?.type == 'Link'
}

// Replaces every link in the fields of a response with the entry or asset it
// points to. A link to something the response does not hold, because it is
// not published or lies deeper than was asked for, is left out. Entries can
// link to each other in a circle, which the result then does too.
export function resolveLinks<Item>(collection: Collection) {
  const { items, includes } = collection
  const entities = [
    ...items,
    ...(includes?.Entry ?? []),
    ...(includes?.Asset ?? []),
  ]

  const byId = new Map(
    entities.map((entity) => [`${entity.sys.type}:${entity.sys.id}`, entity]),
  )

  // A link is swapped for what it points to without going into that, since
  // every entity gets its own fields resolved below.
  const resolve = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(resolve).filter((item) => item !== undefined)
    }

    if (!value || typeof value != 'object') return value

    if (isLink(value)) {
      return byId.get(`${value.sys.linkType}:${value.sys.id}`)
    }

    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, resolve(item)])
        .filter(([, item]) => item !== undefined),
    )
  }

  for (const entity of entities) {
    entity.fields = resolve(entity.fields)
  }

  return items as Item[]
}
