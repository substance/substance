import { isString, DocumentNode, PropertyAnnotation, TextNode } from 'substance'
import NextDocumentSchema from './NextDocumentSchema'
import { INCREMENT_VERSION, ADD_NODE, ADD_PROPERTY, ADD_CHILD_TYPE, BUILT_INS } from './_SchemaConstants'
import SchemaDefinition from './_SchemaDefinition'

export default class SchemaBuilder {
  constructor (rootType) {
    this.rootType = rootType
    this._actions = []
    this._definition = new SchemaDefinition()
  }

  nextVersion (define) {
    this._record({ type: INCREMENT_VERSION })
    define(this)
  }

  addNode (nodeType, parentType, spec = {}, options = {}) {
    if (!isString(nodeType)) throw new Error("'nodeType' is mandatory and must be string")
    if (!isString(parentType) || !BUILT_INS.has(parentType)) throw new Error(`'parentType' is mandatory and must be one of ${Array.from(BUILT_INS).join(',')}`)
    this._record({ type: ADD_NODE, nodeType, parentType, options })
    Object.keys(spec).forEach(propertyName => {
      this.addProperty(nodeType, propertyName, spec[propertyName])
    })
  }

  addProperty (nodeType, propertyName, definition) {
    this._record({ type: ADD_PROPERTY, nodeType, propertyName, definition })
  }

  addChildTypes (nodeType, propertyName, ...childTypes) {
    childTypes.forEach(childType => {
      this._record({ type: ADD_CHILD_TYPE, nodeType, propertyName, childType })
    })
  }

  createSchema () {
    const nodes = this._buildNodes()
    const rootType = this.rootType
    const version = this._definition.version
    return new NextDocumentSchema(version, rootType, nodes, this._actions)
  }

  _record (action) {
    this._definition.apply(action)
    this._actions.push(action)
  }

  _buildNodes () {
    const nodeBuilder = new NodeBuilder(this._definition.nodes)
    return nodeBuilder.createNodes()
  }
}

class NodeBuilder {
  constructor (nodeSpecs) {
    this.nodeSpecs = nodeSpecs
  }

  createNodes () {
    const nodeSpecs = this.nodeSpecs
    const nodeClasses = new Map()
    for (const nodeType of nodeSpecs.keys()) {
      this._createNode(nodeClasses, nodeType, nodeSpecs)
    }
    return nodeClasses
  }

  _createNode (nodeClasses, nodeType, nodeSpecs) {
    if (nodeClasses.has(nodeType)) return nodeClasses.get(nodeType)
    const nodeSpec = nodeSpecs.get(nodeType)
    // map the nodeSpec to native substance data spec
    let ParentNodeClass
    const parentType = nodeSpec.parentType
    switch (parentType) {
      case '@node': {
        ParentNodeClass = DocumentNode
        break
      }
      case '@annotation': {
        ParentNodeClass = PropertyAnnotation
        break
      }
      case '@text': {
        ParentNodeClass = TextNode
        break
      }
      default:
        //
    }
    if (!ParentNodeClass) {
      ParentNodeClass = nodeClasses.get(parentType)
      if (ParentNodeClass === 'WAITING') {
        throw new Error('Cyclic dependency!')
      } else if (!ParentNodeClass) {
        nodeClasses.set(parentType, 'WAITING')
        ParentNodeClass = this._createNode(nodeClasses, parentType, nodeSpecs)
      }
    }
    if (!ParentNodeClass) {
      throw new Error('Can not resolve parent class ' + parentType)
    }
    // EXPERIMENTAL: allow to define mixins
    // What I don't like here is, that the mixin impl could break with schema changes
    if (nodeSpec.options.Mixin) {
      ParentNodeClass = nodeSpec.options.Mixin(ParentNodeClass)
    }

    const compiledSpec = this._getCompiledSpec(nodeType, nodeSpec)
    class Node extends ParentNodeClass {
      define () {
        return compiledSpec
      }
    }
    nodeClasses.set(nodeType, Node)
    return Node
  }

  _getCompiledSpec (nodeType, nodeSpec) {
    const nodeDef = { type: nodeType }
    for (const [propName, propSpec] of nodeSpec.properties.entries()) {
      nodeDef[propName] = this._compileProperty(propSpec)
    }
    return nodeDef
  }

  _compileProperty (spec) {
    // compile to low-level substance data property specification
    const { type, options } = spec
    switch (type) {
      case 'integer':
      case 'number':
        return Object.assign({ default: 0 }, options, { type })
      case 'boolean':
        return Object.assign({ default: false }, options, { type })
      case 'string':
        return Object.assign({ default: '' }, options, { type })
      case 'string-array':
        return Object.assign({ default: [] }, options, { type: ['array', 'string'] })
      case 'text':
        return Object.assign({ default: '' }, options, { type, targetTypes: options.childTypes })
      case 'child':
        return Object.assign({ default: null }, options, { type: 'id', owned: true, targetTypes: options.childTypes })
      case 'children':
      case 'container':
        return Object.assign({ default: [] }, options, { type: ['array', 'id'], owned: true, targetTypes: options.childTypes })
      case 'one':
        return Object.assign({ default: null }, options, { type: 'id', targetTypes: options.targetTypes })
      case 'many':
        return Object.assign({ default: [] }, options, { type: 'id', targetTypes: options.targetTypes })
      default:
        throw new Error('Unsupported type')
    }
  }
}
