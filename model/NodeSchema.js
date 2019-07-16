export default class NodeSchema {
  constructor (properties, superTypes) {
    this._properties = properties
    this._superTypes = superTypes
    // Analysing ownership:
    // This is for hierarchal aspects in the model
    // I.e. a node can have a reference or a list of references to other nodes.
    // If the property 'owned' is set in the schema spec,
    // this has an effect on cascaded deletions, or the order of cloning, for example.
    this._ownedPropNames = new Set()
    this._ownedProps = []
    for (let prop of properties.values()) {
      if ((prop.isReference() && prop.isOwned()) || (prop.type === 'file')) {
        this._ownedPropNames.add(prop.name)
        this._ownedProps.push(prop)
      }
    }
  }

  getProperty (name) {
    return this._properties.get(name)
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

  getSuperType () {
    return this._superTypes[0]
  }

  getSuperTypes () {
    return this._superTypes.slice()
  }

  [Symbol.iterator] () {
    return this._properties.values()
  }
}
