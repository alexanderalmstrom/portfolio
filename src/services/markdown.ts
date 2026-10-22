import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestUrl } from '@tanstack/react-start/server'
import { Marked, Renderer } from 'marked'

// Where the site is opened: the address the server was asked for when it
// renders the page, and that of the page in the browser.
const getLocation = createIsomorphicFn()
  .server(() => getRequestUrl({ xForwardedHost: true }).href)
  .client(() => window.location.href)

// A link that leaves the site opens in a new tab. Links to the site itself,
// to an email address or to a phone number stay where they are.
function isExternal(href: string) {
  const location = new URL(getLocation())
  const url = new URL(href, location)

  return url.protocol.startsWith('http') && url.origin != location.origin
}

const parser = new Marked({
  async: false,
  breaks: true,
  renderer: {
    link(token) {
      const html = Renderer.prototype.link.call(this, token)

      if (!isExternal(token.href)) return html

      return html.replace(
        /^<a /,
        '<a target="_blank" rel="noopener noreferrer" ',
      )
    },
  },
})

export function markdown(content?: string) {
  if (!content) return undefined

  return {
    __html: parser.parse(content, { async: false }),
  }
}
