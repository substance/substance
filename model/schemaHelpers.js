export const STRING = { type: 'string', default: '' }

export function TEXT (...targetTypes) {
  return { type: 'text', targetTypes }
}

export const PLAIN_TEXT = Object.freeze(TEXT())

export const STRING_ARRAY = { type: ['array', 'string'], default: [] }

export const BOOLEAN = { type: 'boolean', default: false }

export function MANY (...targetTypes) {
  return { type: ['array', 'id'], targetTypes, default: [] }
}

export function ONE (...targetTypes) {
  return { type: 'id', targetTypes, default: null }
}

export function CHILDREN (...targetTypes) {
  return { type: ['array', 'id'], targetTypes, default: [], owned: true }
}

// EXPERIMENTAL: similar to CHILDREN but only a single id, e.g. figure.content -> graphic
// for now we make this non-optional
export function CHILD (...targetTypes) {
  return { type: 'id', targetTypes, owned: true }
}

export function OPTIONAL (type) {
  type.optional = true
  return type
}
