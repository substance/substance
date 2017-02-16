import cloneDeep from '../../util/cloneDeep'
import forEach from '../../util/forEach'
import isArray from '../../util/isArray'
import isBoolean from '../../util/isBoolean'
import isNumber from '../../util/isNumber'
import isObject from '../../util/isObject'
import isString from '../../util/isString'
import EventEmitter from '../../util/EventEmitter'
import Property from './Property'

/*
  Base node implementation.

  @prop {String} id an id that is unique within this data
 */
class Node extends EventEmitter {

  /**
    @param {Object} properties
  */
  constructor(data) {
    super()

    const NodeClass = this.constructor

    let schema = NodeClass.schema
    for (var name in schema) {
      if (!schema.hasOwnProperty(name)) continue
      let prop = schema[name]
      // check integrity of provided data, such as type correctness,
      // and mandatory properties
      const propIsGiven = (data[name] !== undefined)
      const hasDefault = prop.hasDefault()
      const isOptional = prop.isOptional()
      if ( (!isOptional && !hasDefault) && !propIsGiven) {
        throw new Error('Property ' + name + ' is mandatory for node type ' + this.type)
      }
      if (propIsGiven) {
        this[name] = _checked(prop, data[name])
      } else if (hasDefault) {
        this[name] = cloneDeep(_checked(prop, prop.getDefault()))
      } else {
        // property is optional
      }
    }
  }

  dispose() {}

  /**
    Check if the node is of a given type.

    @param {String} typeName
    @returns {Boolean} true if the node has a parent with given type, false otherwise.
  */
  isInstanceOf(typeName) {
    return Node.isInstanceOf(this.constructor, typeName)
  }

  getSchema() {
    return this.constructor.schema
  }

  /**
    Get a the list of all polymorphic types.

    @returns {String[]} An array of type names.
   */
  getTypeNames() {
    var typeNames = []
    var NodeClass = this.constructor
    while (NodeClass.type !== "node") {
      typeNames.push(NodeClass.type)
      NodeClass = Object.getPrototypeOf(NodeClass)
    }
    return typeNames
  }

  /**
   * Get the type of a property.
   *
   * @param {String} propertyName
   * @returns The property's type.
   */
  getPropertyType(propertyName) {
    var schema = this.constructor.schema
    return schema[propertyName].type
  }

  /**
    Convert node to JSON.

    @returns {Object} JSON representation of node.
   */
  toJSON() {
    var data = {
      type: this.type
    }
    const schema = this.getSchema()
    forEach(schema, (prop, name) => {
      let val = this[name]
      if (prop.isOptional() && val === undefined) return
      if (isArray(val) || isObject(val)) {
        val = cloneDeep(val)
      }
      data[prop.name] = val
    })
    return data
  }

  get type() {
    return this.constructor.type
  }

}

Node.prototype._isNode = true

// NOTE: this code and its deps will always be included in the bundle as rollup considers this as global side-effect
Object.defineProperty(Node, 'schema', {
  get() { return this._schema },
  set(schema) {
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

Node.define = Node.defineSchema = function define(schema) {
  this.schema = schema
}

Node.schema = {
  type: "node",
  id: 'string'
}

/**
  Internal implementation of Node.prototype.isInstanceOf.

  @static
  @private
  @returns {Boolean}
 */
Node.isInstanceOf = function(NodeClass, typeName) {
  var type = NodeClass.type
  while (type !== "node") {
    if (type === typeName) return true
    var _super = Object.getPrototypeOf(NodeClass.prototype).constructor
    if (_super && _super.type) {
      NodeClass = _super
      type = NodeClass.type
    } else {
      break
    }
  }
  return false
}

// ### Internal implementation

function compileSchema(NodeClass, schema) {
  let compiledSchema = _compileSchema(schema)
  let schemas = [compiledSchema]
  let clazz = NodeClass
  while(clazz) {
    var parentProto = Object.getPrototypeOf(clazz.prototype)
    if (!parentProto) {
      break
    }
    clazz = parentProto.constructor
    if (clazz && clazz._schema) {
      schemas.unshift(clazz._schema)
    }
  }
  schemas.unshift({})
  return Object.assign.apply(null, schemas)
}

function _compileSchema(schema) {
  let compiledSchema = {}
  forEach(schema, function(definition, name) {
    // skip 'type'
    if (name === 'type') {
      return
    }
    if (isString(definition) || isArray(definition)) {
      definition = { type: definition }
    }
    definition = _compileDefintion(definition)
    definition.name = name
    compiledSchema[name] = new Property(definition)
  })
  return compiledSchema
}

function _compileDefintion(definition) {
  let result = definition
  if (isArray(definition.type) && definition.type[0] !== "array") {
    definition.type = [ "array", definition.type[0] ]
  } else if (definition.type === 'text') {
    result = {
      type: "string",
      default: '',
      _isText: true
    }
  }
  return result
}

function _checked(prop, value) {
  let type
  let name = prop.name
  if (prop.isArray()) {
    type = "array"
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
  if (type === "string" && !isString(value) ||
      type === "boolean" && !isBoolean(value) ||
      type === "number" && !isNumber(value) ||
      type === "array" && !isArray(value) ||
      type === "id" && !isString(value) ||
      type === "object" && !isObject(value)) {
    throw new Error('Illegal value type for property ' + name + ': expected ' + type + ', was ' + (typeof value))
  }
  return value
}

export default Node
