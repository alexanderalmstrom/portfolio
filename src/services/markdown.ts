import { Marked, Renderer } from 'marked'

// A link that leaves the site opens in a new tab. Links to the site itself,
// to an email address or to a phone number stay where they are.
function isExternal(href: string) {
  const url = new URL(href, window.location.href)

  return url.protocol.startsWith('http') && url.origin != window.location.origin
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
