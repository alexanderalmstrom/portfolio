// A page can keep the cover between two pages up while it gets something
// ready that would stutter if it happened as the cover leaves, or that
// would be seen to arrive after it (see PageTransition). The cover stays
// for as long as anything holds it, and comes up by itself for a page that
// is opened directly.
let holds = 0

const listeners = new Set<() => void>()

function changed() {
  listeners.forEach((listener) => listener())
}

// Holds the cover until the returned function is called.
export function holdCover() {
  let held = true

  holds++
  changed()

  return () => {
    if (!held) return

    held = false
    holds--
    changed()
  }
}

export function isCoverHeld() {
  return holds > 0
}

export function onCoverHeld(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
