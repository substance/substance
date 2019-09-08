import cloneDeep from '../util/cloneDeep'
import forEach from '../util/forEach'
import isArray from '../util/isArray'
import isBoolean from '../util/isBoolean'
import isNumber from '../util/isNumber'
import isObject from '../util/isObject'
import isString from '../util/isString'
import _isDefined from '../util/_isDefined'
import EventEmitter from '../util/EventEmitter'
import NodeProperty from './NodeProperty'
import NodeSchema from './NodeSchema'

const VALUE_TYPES = new Set(['id', 'string', 'number', 'boolean', 'enum', 'object', 'array', 'coordinate'])

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

    // Note: because the schema is defined lazily
    // this makes sure that the schema is compiled
    const NodeClass = this.constructor
    NodeClass._ensureSchemaIsCompiled()

    // plain object to store the nodes data
    this._properties = new Map()

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
        this._properties.set(name, _checked(property, data[name]))
      } else if (hasDefault) {
        this._properties.set(name, cloneDeep(_checked(property, property.getDefault())))
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

  get schema () {
    return this.getSchema()
  }

  /**
    Get a the list of all polymorphic types.

    @returns {String[]} An array of type names.
   */
  getTypeNames () {
    let NodeClass = this.constructor
    let typeNames = this.schema.getSuperTypes()
    typeNames.unshift(NodeClass.type)
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
      let val = this._properties.get(prop.name)
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
   * This gets called during schema compilation.
   *
   * Override this method in sub-classes to provide the accord schema specification.
   *
   * > Note: it is not necessary to call super.define() because Node schemas inherit the parent node's schema
   * > per se
   */
  define () {
    return {
      type: '@node',
      id: 'string'
    }
  }

  _set (propName, value) {
    this._properties.set(propName, value)
  }

  set (propName, value) {
    this._set(propName, value)
  }

  get (propName) {
    return this._properties.get(propName)
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

  get _isNode () { return true }

  static get type () {
    let NodeClass = this
    return NodeClass.schema.type
  }

  static get schema () {
    let NodeClass = this
    NodeClass._ensureSchemaIsCompiled()
    return NodeClass['compiledSchema']
  }

  static set schema (spec) {
    // Note: while the preferred way of defining a schema is via implementing Node.define()
    // we still leave this here
    this._compileSchema(spec)
  }

  static _ensureSchemaIsCompiled () {
    let NodeClass = this
    // If the schema has not been set explicitly, derive it from the parent schema
    if (!NodeClass.hasOwnProperty('compiledSchema')) {
      NodeClass._compileSchema()
    }
  }

  static _compileSchema (schema) {
    let NodeClass = this
    if (!schema) {
      // Experimental: I'd like to allow schema definition as prototype method
      // for sake of convenience
      let define = NodeClass.prototype.define
      schema = define()
    }
    NodeClass['compiledSchema'] = compileSchema(NodeClass, schema)
  }
}

// ### Internal implementation

function _assign (maps) {
  let result = new Map()
  for (let m of maps) {
    for (let [key, value] of m) {
      if (result.has(key)) result.delete(key)
      result.set(key, value)
    }
  }
  return result
}

function compileSchema (NodeClass, spec) {
  const type = spec.type
  if (!_isDefined(type)) {
    throw new Error('"type" is required')
  }
  let properties = _compileProperties(spec)
  let allProperties = [properties]
  let ParentNodeClass = _getParentNodeClass(NodeClass)
  while (ParentNodeClass) {
    // ATTENTION: this will actually lead to a recursive compileSchema() call
    // if the parent class schema has not been compiled yet
    let parentSchema = ParentNodeClass.schema
    allProperties.unshift(parentSchema._properties)
    ParentNodeClass = _getParentNodeClass(ParentNodeClass)
  }
  let superTypes = _getSuperTypes(NodeClass)
  let _schema = new NodeSchema(type, _assign(allProperties), superTypes)

  // define property getter and setters
  for (let prop of _schema) {
    let name = prop.name
    Object.defineProperty(NodeClass.prototype, name, {
      get () {
        return this.get(name)
      },
      set (val) {
        this.set(name, val)
      },
      enumerable: true,
      configurable: true
    })
  }

  return _schema
}

function _compileProperties (schema) {
  let properties = new Map()
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
    properties.set(name, new NodeProperty(name, definition))
  })
  return properties
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

  // wrap the array into a Set
  if (result.targetTypes) {
    result.targetTypes = new Set(result.targetTypes)
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
      (type === 'enum' && !isString(value)) ||
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
  let ParentNodeClass = _getParentNodeClass(NodeClass)
  while (ParentNodeClass && ParentNodeClass.type !== '@node') {
    typeNames.push(ParentNodeClass.type)
    ParentNodeClass = _getParentNodeClass(ParentNodeClass)
  }
  return typeNames
}

function _getParentNodeClass (Clazz) {
  var parentProto = Object.getPrototypeOf(Clazz.prototype)
  if (parentProto && parentProto._isNode) {
    return parentProto.constructor
  }
}
