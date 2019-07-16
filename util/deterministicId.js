const COUNTERS = new Map()

export default function deterministicId (prefix) {
  prefix = prefix || ''
  let counter
  if (!COUNTERS.has(prefix)) {
    counter = 0
  } else {
    counter = COUNTERS.get(prefix)
  }
  counter++
  COUNTERS.set(prefix, counter)
  if (prefix) {
    return `${prefix}-${counter}`
  } else {
    return String(counter)
  }
}
