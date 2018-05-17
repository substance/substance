import forEach from '../util/forEach'

export default class NodeSchema {
  constructor (properties) {
    this.properties = properties

    // Analysing ownership:
    // This is for hierarchal aspects in the model
    // I.e. a node can have a reference or a list of references to other nodes.
    // If the property 'owned' is set in the schema spec,
    // this has an effect on cascaded deletions, or the order of cloning, for example.
    this._ownedPropNames = new Set()
    this._ownedProps = []
    forEach(properties, (prop) => {
      if ((prop.isReference() && prop.isOwned()) || (prop.type === 'file')) {
        this._ownedPropNames.add(prop.name)
        this._ownedProps.push(prop)
      }
    })
  }

  getProperty (name) {
    return this.properties[name]
  }

  hasOwnedProperties () {
    return this._ownedPropNames.size > 0
  }

  getOwnedProperties () {
    return this._ownedProps.slice()
  }

  isOwned (name) {
    return this._ownedPropNames.has(name)
  }

  [Symbol.iterator] () {
    const properties = this.properties
    let ids = Object.keys(properties)
    let idx = 0
    return { // Iterator
      next () {
        let done = idx > ids.length - 1
        if (done) {
          return { done }
        } else {
          return {
            value: properties[ids[idx++]]
          }
        }
      }
    }
  }
}
