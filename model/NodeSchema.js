export default class NodeSchema {
  constructor (type, properties, superTypes) {
    this.type = type
    this._properties = properties
    this._superTypes = superTypes
    // Note: owned props are properties of type 'child' or 'chidren'
    // whereas properties of type 'one' or 'many' are not owned.
    this._childProps = new Map()
    this._relationshipProps = new Map()
    for (const prop of properties.values()) {
      if (prop.isReference()) {
        if (prop.isOwned()) {
          this._childProps.set(prop.name, prop)
        } else {
          this._relationshipProps.set(prop.name, prop)
        }
      }
    }
  }

  getProperty (name) {
    return this._properties.get(name)
  }

  hasChildProperties () {
    return this._childProps.size > 0
  }

  getChildProperties () {
    return this._childProps.values()
  }

  hasRelationshipProperties () {
    return this._relationshipProps.size > 0
  }

  getRelationshipProperties () {
    return this._relationshipProps.values()
  }

  isOwned (name) {
    return this._childProps.has(name)
  }

  isRelationship (name) {
    return this._relationshipProps.has(name)
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
