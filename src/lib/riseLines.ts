// Seconds between each line starting to rise.
const STAGGER = 0.08

// Lines past this one start along with it, so the end of a long text is not
// kept waiting.
const MAX_STAGGERED = 10

// One range per rendered line of the text in an element, each from the start
// of its first word to the end of its last.
function measureLines(element: HTMLElement) {
  const lines: Range[] = []
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const word = document.createRange()
  let bottom = 0

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const match of (node.nodeValue ?? '').matchAll(/\S+/g)) {
      const end = match.index + match[0].length

      word.setStart(node, match.index)
      word.setEnd(node, end)

      const rect = word.getBoundingClientRect()

      // A word starts a new line when its middle is below the line so far.
      if (!lines.length || rect.top + rect.height / 2 > bottom) {
        const line = document.createRange()

        line.setStart(node, match.index)
        lines.push(line)
        bottom = rect.bottom
      }

      lines[lines.length - 1].setEnd(node, end)
      bottom = Math.max(bottom, rect.bottom)
    }
  }

  return lines
}

// The content of a line, within copies of the inline elements it is in. A
// range only clones the elements it runs through, not those that hold all of
// it, such as the bold around a whole line.
function cloneLine(line: Range, element: HTMLElement) {
  let content: Node = line.cloneContents()
  let ancestor: Node | null = line.commonAncestorContainer

  if (ancestor.nodeType == Node.TEXT_NODE) ancestor = ancestor.parentNode

  for (; ancestor && ancestor != element; ancestor = ancestor.parentNode) {
    const wrapper = ancestor.cloneNode(false)

    wrapper.appendChild(content)
    content = wrapper
  }

  return content
}

// Splits the text of an element into its rendered lines and lets each one
// rise through a mask of its own (see Hero), starting at the given place in
// the stagger. The original content is put back when the last line has
// risen, so the text wraps freely again.
export function riseLines(element: HTMLElement, first = 0) {
  const lines = measureLines(element)

  if (!lines.length) return null

  const original = [...element.childNodes]

  const masks = lines.map((line, index) => {
    const mask = document.createElement('span')
    const inner = document.createElement('span')
    const delay = Math.min(first + index, MAX_STAGGERED) * STAGGER

    // The padding keeps descenders from being cut.
    mask.className = '-mb-[0.15em] block overflow-hidden pb-[0.15em]'
    inner.className = 'block animate-rise'
    inner.style.animationDelay = `${delay}s`

    inner.append(cloneLine(line, element))
    mask.append(inner)

    return mask
  })

  element.replaceChildren(...masks)

  // Not when the lines are gone already, as when React has set the content
  // again.
  const restore = () => {
    if (masks[0].parentNode === element) element.replaceChildren(...original)
  }

  masks[masks.length - 1].firstChild?.addEventListener(
    'animationend',
    restore,
    { once: true },
  )

  return { count: lines.length, restore }
}
