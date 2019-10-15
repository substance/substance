import { isString } from '../util'
import { INCREMENT_VERSION, ADD_NODE, ADD_PROPERTY, ADD_CHILD_TYPE, BUILT_INS } from './_SchemaConstants'

export default class SchemaDefinition {
  constructor () {
    this.version = 0
    this.nodes = new Map()
  }

  apply (action) {
    switch (action.type) {
      case INCREMENT_VERSION:
        return this._incrementVersion()
      case ADD_NODE: {
        return this._addNode(action)
      }
      case ADD_PROPERTY: {
        return this._addProperty(action)
      }
      case ADD_CHILD_TYPE: {
        return this._addChildType(action)
      }
      default:
        throw new Error(`Invalid action ${action.type}`)
    }
  }

  _incrementVersion () {
    this.version++
  }

  _addNode (action) {
    const { nodeType, parentType, options } = action
    if (this.nodes.has(nodeType)) {
      throw new Error(`Node ${nodeType} is already defined`)
    }
    if (!BUILT_INS.has(parentType) && !this.nodes.has(parentType)) {
      throw new Error(`Unknown parent type ${parentType}`)
    }
    this.nodes.set(nodeType, { type: nodeType, parentType, properties: new Map(), options })
  }

  _addProperty (action) {
    const { nodeType, propertyName, definition } = action
    const nodeDef = this.nodes.get(nodeType)
    if (!nodeDef) throw new Error(`Node ${nodeType} is not defined`)
    if (nodeDef.properties.has(propertyName)) throw new Error(`Property ${propertyName} already defined for type ${nodeType}`)
    let type
    let options = {}
    if (isString(definition)) {
      type = definition
    } else {
      type = definition.type
      options = Object.assign(options, definition)
    }
    if (options.childTypes) {
      options.childTypes = options.childTypes.slice()
    }
    if (!type) throw new Error("'type' is required")
    nodeDef.properties.set(propertyName, { type, options })
  }

  _addChildType (action) {
    const { nodeType, propertyName, childType } = action
    const nodeDef = this.nodes.get(nodeType)
    if (!nodeDef) throw new Error(`Node ${nodeType} is not defined`)
    const propDef = nodeDef.properties.get(propertyName)
    if (!propDef) throw new Error(`Property ${propertyName} is not defined for type ${nodeType}`)
    if (!propDef.childTypes) propDef.childTypes = []
    propDef.childTypes.push(childType)
  }
}
