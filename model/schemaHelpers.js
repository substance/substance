import flatten from '../util/flatten'
import isString from '../util/isString'

export const STRING = { type: 'string', default: '' }

export function TEXT (...targetTypes) {
  targetTypes = flatten(targetTypes)
  return { type: 'text', targetTypes }
}

export const PLAIN_TEXT = Object.freeze(TEXT())

export const STRING_ARRAY = { type: ['array', 'string'], default: [] }

export const BOOLEAN = { type: 'boolean', default: false }

export function ENUM (values, opts = {}) {
  let def = { type: 'enum', values }
  Object.assign(def, opts)
  return def
}

export function MANY (...nodeTypes) {
  nodeTypes = flatten(nodeTypes)
  return { type: ['array', 'id'], targetTypes: nodeTypes, default: [] }
}

export function ONE (...nodeTypes) {
  nodeTypes = flatten(nodeTypes)
  return { type: 'id', targetTypes: nodeTypes, default: null }
}

export function CHILDREN (...nodeTypes) {
  nodeTypes = flatten(nodeTypes)
  return { type: ['array', 'id'], targetTypes: nodeTypes, default: [], owned: true }
}

// EXPERIMENTAL: similar to CHILDREN but only a single id, e.g. figure.content -> graphic
// for now we make this non-optional
export function CHILD (...nodeTypes) {
  nodeTypes = flatten(nodeTypes)
  return { type: 'id', targetTypes: nodeTypes, owned: true }
}

export function CONTAINER (spec) {
  let nodeTypes, defaultTextType
  // convenience: only one text type
  if (isString(spec)) {
    nodeTypes = [spec]
    defaultTextType = spec
  // general
  } else {
    ({ nodeTypes, defaultTextType } = spec)
  }
  if (!nodeTypes) throw new Error('CONTAINER({ nodeTypes: [...] }) is mandatory.')
  if (!defaultTextType) throw new Error('CONTAINER({ defaultTextType: [...] }) is mandatory.')
  let def = CHILDREN(...nodeTypes)
  def.defaultTextType = defaultTextType
  def._isContainer = true
  return def
}

export function OPTIONAL (type) {
  type.optional = true
  return type
}
