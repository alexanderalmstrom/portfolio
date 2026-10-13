export function createEvent(
  name: string,
  params: CustomEventInit = {
    bubbles: false,
    cancelable: false,
    detail: undefined,
  },
) {
  return new CustomEvent(name, params)
}

// iPhones and iPads count as Apple devices too.
export function isApple() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
}
