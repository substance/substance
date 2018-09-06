import cloneDeep from '../util/cloneDeep'
import forEach from '../util/forEach'
import isArray from '../util/isArray'
import isBoolean from '../util/isBoolean'
import isNumber from '../util/isNumber'
import isObject from '../util/isObject'
import isString from '../util/isString'
import EventEmitter from '../util/EventEmitter'
import NodeProperty from './NodeProperty'
import NodeSchema from './NodeSchema'

const VALUE_TYPES = new Set(['string', 'number', 'boolean', 'object', 'array', 'coordinate'])

/*
  Base node implementation.

  @prop {String} id an id that is unique within this data
 */
export default class Node extends EventEmitter {
  /**
    @param {Object} properties
  */
  constructor (...args) {
    super()

    // NOTE: this indirection allows us to implement a overridable initializer
    // For instance, DocumentNode sets the document instance and the props
    this._initialize(...args)
  }

  _initialize (data) {
    const NodeClass = this.constructor

    let schema = NodeClass.schema
    for (let property of schema) {
      let name = property.name
      // check integrity of provided data, such as type correctness,
      // and mandatory properties
      const propIsGiven = (data[name] !== undefined)
      const isOptional = property.isOptional()
      const hasDefault = property.hasDefault()
      if (!isOptional && !propIsGiven) {
        throw new Error('Property ' + name + ' is mandatory for node type ' + this.type)
      }
      if (propIsGiven) {
        this[name] = _checked(property, data[name])
      } else if (hasDefault) {
        this[name] = cloneDeep(_checked(property, property.getDefault()))
      } else {
        // property is optional
      }
    }
  }

  dispose () {
    this._disposed = true
  }

  isDisposed () {
    return Boolean(this._disposed)
  }

  /**
    Check if the node is of a given type.

    @param {String} typeName
    @returns {Boolean} true if the node has a parent with given type, false otherwise.
  */
  isInstanceOf (typeName) {
    return Node.isInstanceOf(this.constructor, typeName)
  }

  getSchema () {
    return this.constructor.schema
  }

  /**
    Get a the list of all polymorphic types.

    @returns {String[]} An array of type names.
   */
  getTypeNames () {
    let NodeClass = this.constructor
    let typeNames = this.schema.getSuperTypes()
    if (NodeClass.hasOwnProperty('type')) {
      typeNames.unshift(NodeClass.type)
    }
    return typeNames
  }

  /**
   * Get the type of a property.
   *
   * @param {String} propertyName
   * @returns The property's type.
   */
  getPropertyType (propertyName) {
    return this.constructor.schema.getProperty(propertyName).type
  }

  /**
    Convert node to JSON.

    @returns {Object} JSON representation of node.
   */
  toJSON () {
    var data = {
      type: this.type
    }
    const schema = this.getSchema()
    for (let prop of schema) {
      let val = this[prop.name]
      if (prop.isOptional() && val === undefined) continue
      if (isArray(val) || isObject(val)) {
        val = cloneDeep(val)
      }
      data[prop.name] = val
    }
    return data
  }

  get type () {
    return this.constructor.type
  }

  /**
    Internal implementation of Node.prototype.isInstanceOf.
    @returns {Boolean}
   */
  static isInstanceOf (NodeClass, typeName) {
    let schema = NodeClass.schema
    if (!schema) return false
    if (NodeClass.type === typeName) return true
    for (let superType of schema._superTypes) {
      if (superType === typeName) return true
    }
    return false
  }

  // TODO: do we really need this?
  get _isNode () { return true }

  // TODO: do we really need this?
  static define (schema) {
    _define(schema)
  }

  static defineSchema (schema) {
    _define(schema)
  }
}

// Attention: this code and its deps will always be included in the bundle as rollup considers this as global side-effect
Object.defineProperty(Node, 'schema', {
  get () {
    let NodeClass = this
    // If the schema has not been set explicitly, derive it from the parent schema
    if (!NodeClass.hasOwnProperty('_schema')) {
      let ParentNodeClass = _getParentClass(NodeClass)
      let parentSchema = ParentNodeClass.schema
      NodeClass._schema = new NodeSchema(parentSchema.properties, _getSuperTypes(NodeClass))
    }
    return NodeClass._schema
  },
  set (schema) {
    let NodeClass = this
    // TODO: discuss if we want this. Is a bit more convenient
    // ATM we transfer 'type' to the static property
    if (schema.type) {
      NodeClass.type = schema.type
    }
    // collects a full schema considering the schemas of parent class
    // we will use the unfolded schema, check integrity of the given props (mandatory, readonly)
    // or fill in default values for undefined properties.
    NodeClass._schema = compileSchema(NodeClass, schema)
  }
})

Node.schema = {
  type: '@node',
  id: 'string'
}

// ### Internal implementation

// TODO: IMO we don't need this anymore
// The common way to define the schema is
// NodeClass.schema = {
//   ...
// }
function _define (schema) {
  console.error("DEPRECATED: use 'Node.schema = {...}' instead")
  let NodeClass = this
  NodeClass.schema = schema
}

function compileSchema (NodeClass, schema) {
  let compiledSchema = _compileSchema(schema)
  let schemas = [compiledSchema]
  let Clazz = _getParentClass(NodeClass)
  while (Clazz) {
    if (Clazz && Clazz._schema) {
      schemas.unshift(Clazz._schema.properties)
    }
    Clazz = _getParentClass(Clazz)
  }
  schemas.unshift({})
  let superTypes = _getSuperTypes(NodeClass)
  return new NodeSchema(Object.assign.apply(null, schemas), superTypes)
}

function _compileSchema (schema) {
  let compiledSchema = {}
  forEach(schema, function (definition, name) {
    // skip 'type'
    if (name === 'type') return
    if (isString(definition) || isArray(definition)) {
      definition = { type: definition }
    } else {
      definition = cloneDeep(definition)
    }
    definition = _compileDefintion(definition)
    definition.name = name
    compiledSchema[name] = new NodeProperty(name, definition)
  })
  return compiledSchema
}

function _isValueType (t) {
  return VALUE_TYPES.has(t)
}

function _compileDefintion (definition) {
  let result = Object.assign({}, definition)
  let type = definition.type
  if (isArray(type)) {
    // there are different allowed formats:
    // 1. canonical: ['array', 'id'], ['array', 'some-node']
    // 2. implcit: ['object']
    // 3. multi-type: ['p', 'list']
    let defs = type
    let lastIdx = defs.length - 1
    let first = defs[0]
    let last = defs[lastIdx]
    let isCanonical = first === 'array'
    if (isCanonical) {
      result.type = defs.slice()
      // 'semi'-canonical
      if (last !== 'id' && !_isValueType(last)) {
        result.targetTypes = [last]
        result.type[lastIdx] = 'id'
      }
    } else {
      if (defs.length > 1) {
        defs.forEach(t => {
          if (_isValueType(t)) {
            throw new Error('Multi-types must consist of node types.')
          }
        })
        result.type = [ 'array', 'id' ]
        result.targetTypes = defs
      } else {
        if (_isValueType(first)) {
          result.type = [ 'array', first ]
        } else {
          result.type = [ 'array', 'id' ]
          result.targetTypes = defs
        }
      }
    }
  } else if (type === 'text') {
    result = {
      type: 'string',
      default: '',
      _isText: true,
      targetTypes: definition.targetTypes
    }
  // single reference type
  } else if (type !== 'id' && !_isValueType(type)) {
    result.type = 'id'
    result.targetTypes = [type]
  }

  return result
}

function _checked (prop, value) {
  let type
  let name = prop.name
  if (prop.isArray()) {
    type = 'array'
  } else {
    type = prop.type
  }
  if (value === null) {
    if (prop.isNotNull()) {
      throw new Error('Value for property ' + name + ' is null.')
    } else {
      return value
    }
  }
  if (value === undefined) {
    throw new Error('Value for property ' + name + ' is undefined.')
  }
  if ((type === 'string' && !isString(value)) ||
      (type === 'boolean' && !isBoolean(value)) ||
      (type === 'number' && !isNumber(value)) ||
      (type === 'array' && !isArray(value)) ||
      (type === 'id' && !isString(value)) ||
      (type === 'object' && !isObject(value))) {
    throw new Error('Illegal value type for property ' + name + ': expected ' + type + ', was ' + (typeof value))
  }
  return value
}

function _getSuperTypes (NodeClass) {
  var typeNames = []
  let SuperClass = _getParentClass(NodeClass)
  while (SuperClass && SuperClass.type !== '@node') {
    if (SuperClass.hasOwnProperty('type')) {
      typeNames.push(SuperClass.type)
    }
    SuperClass = _getParentClass(SuperClass)
  }
  return typeNames
}

function _getParentClass (Clazz) {
  var parentProto = Object.getPrototypeOf(Clazz.prototype)
  if (parentProto) {
    return parentProto.constructor
  }
}
