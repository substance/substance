import { uuid } from '../util'
import DocumentIndex from './DocumentIndex'

export default class RelationshipIndex extends DocumentIndex {
  constructor () {
    super()

    this.reverseIndex = new Map()
    this.sha = uuid()
  }

  select (node) {
    return node.getSchema().hasRelationshipProperties()
  }

  clear () {
    this.reverseIndex.clear()
    this._updateSha()
  }

  get (id) {
    return this.reverseIndex.get(id) || new Set()
  }

  create (node) {
    const relProps = node.getSchema().getRelationshipProperties()
    for (const prop of relProps) {
      if (prop.isArray()) {
        const ids = node.get(prop.name)
        for (const id of ids) {
          this._add(id, node.id)
        }
      } else {
        const id = node.get(prop.name)
        this._add(id, node.id)
      }
    }
  }

  delete (node) {
    const relProps = node.getSchema().getRelationshipProperties()
    for (const prop of relProps) {
      if (prop.isArray()) {
        const ids = node.get(prop.name)
        for (const id of ids) {
          this._remove(id, node.id)
        }
      } else {
        const id = node.get(prop.name)
        this._remove(id, node.id)
      }
    }
  }

  update (node, path, newValue, oldValue) {
    const schema = node.getSchema()
    const propName = path[1]
    if (schema.isRelationship(propName)) {
      const prop = schema.getProperty(propName)
      if (prop.isArray()) {
        for (const id of oldValue) {
          this._remove(id, node.id)
        }
        for (const id of newValue) {
          this._add(id, node.id)
        }
      } else {
        this._remove(oldValue, node.id)
        this._add(newValue, node.id)
      }
    }
  }

  _add (id, ref) {
    if (!id || !ref) return
    let refs = this.reverseIndex.get(id)
    if (!refs) {
      refs = new Set()
      this.reverseIndex.set(id, refs)
    }
    refs.add(ref)
    this._updateSha()
  }

  _remove (id, ref) {
    if (!id || !ref) return
    const refs = this.reverseIndex.get(id)
    if (refs) {
      refs.delete(ref)
      this._updateSha()
    }
  }

  _updateSha () {
    // console.log('RelationshipIndex._updateSha()')
    this.sha = uuid()
  }
}
