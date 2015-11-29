/* jshint latedef:nofunc */

'use strict';

var isBoolean = require('lodash/lang/isBoolean');
var isNumber = require('lodash/lang/isNumber');
var isString = require('lodash/lang/isString');
var isArray = require('lodash/lang/isArray');
var isObject = require('lodash/lang/isObject');
var cloneDeep = require('lodash/lang/cloneDeep');
var each = require('lodash/collection/each');
var extend = require('lodash/object/extend');
var EventEmitter = require('../../util/EventEmitter');

/**
  Base node implementation.

  @private
  @class Node
  @node
  @extends EventEmitter
  @param {Object} properties

  @prop {String} id an id that is unique within this data
 */
function Node(props) {
  EventEmitter.call(this);

  var NodeClass = this.constructor;

  if (!NodeClass.static.name) {
    throw new Error('Every NodeClass must provide a static property "name".');
  }

  each(NodeClass.static.schema, function(prop, name) {
    // check integrity of provided props, such as type correctness,
    // and mandatory properties
    var propIsGiven = (props[name] !== undefined);
    var hasDefault = prop.hasOwnProperty('default');
    var isOptional = prop.optional;
    if ( (!isOptional && !hasDefault) && !propIsGiven) {
      throw new Error('Property ' + name + ' is mandatory for node type ' + this.type);
    }
    if (propIsGiven) {
      this[name] = _checked(prop, props[name]);
    } else if (hasDefault) {
      this[name] = cloneDeep(_checked(prop, prop.default));
    } else {
      // property is optional
    }
  }, this);
}

Node.Prototype = function() {

  /**
    Check if the node is of a given type.

    @param {String} typeName
    @returns {Boolean} true if the node has a parent with given type, false otherwise.
  */
  this.isInstanceOf = function(typeName) {
    return Node.isInstanceOf(this.constructor, typeName);
  };

  /**
    Get a the list of all polymorphic types.

    @returns {String[]} An array of type names.
   */
  this.getTypeNames = function() {
    var typeNames = [];
    var staticData = this.constructor.static;
    while (staticData && staticData.name !== "node") {
      typeNames.push(staticData.name);
      staticData = Object.getPrototypeOf(staticData);
    }
    return typeNames;
  };

  /**
   * Get the type of a property.
   *
   * @param {String} propertyName
   * @returns The property's type.
   */
  this.getPropertyType = function(propertyName) {
    var schema = this.constructor.static.schema;
    return schema[propertyName].type;
  };

  this.toJSON = function() {
    var data = {
      type: this.constructor.static.name
    };
    each(this.constructor.static.schema, function(prop, name) {
      data[prop.name] = this[name];
    }, this);
    return data;
  };

};

EventEmitter.extend(Node);

/**
 * Symbolic name for this model class. Must be set to a unique string by every subclass.
 *
 * @static
 * @type {String}
 */
Node.static.name = "node";

Node.static.defineSchema = function(schema) {
  // in ES6 we would just `this` which is bound to the class
  var NodeClass = this.__class__;
  _defineSchema(NodeClass, schema);
};

Node.static.defineSchema({
  id: 'string'
});

Object.defineProperty(Node.prototype, 'type', {
  configurable: false,
  get: function() {
    return this.constructor.static.name;
  },
  set: function() {
    throw new Error('Property "type" is read-only.');
  }
});

/**
  Internal implementation of Node.prototype.isInstanceOf.

  @static
  @private
  @returns {Boolean}
 */
 Node.isInstanceOf = function(NodeClass, typeName) {
  var staticData = NodeClass.static;
  while (staticData && staticData.name !== "node") {
    if (staticData && staticData.name === typeName) {
      return true;
    }
    staticData = Object.getPrototypeOf(staticData);
  }
  return false;
};

Node.static.isInstanceOf = Node.isInstanceOf;

// ### Internal implementation

function _defineSchema(NodeClass, schema) {
  var compiledSchema = _compileSchema(schema);
  // collects a full schema considering the schemas of parent class
  // we will use the unfolded schema, check integrity of the given props (mandatory, readonly)
  // or fill in default values for undefined properties.
  NodeClass.static.schema = _unfoldedSchema(NodeClass, compiledSchema);
  // computes the set of default properties only once
  NodeClass.static.defaultProps = _extractDefaultProps(NodeClass);

  // still we need that for container, hopefully we find a better approach soon
  if (!NodeClass.static.hasOwnProperty('addressablePropertyNames')) {
    var addressablePropertyNames = [];
    each(NodeClass.static.schema, function(prop, name) {
      if (prop.type === "string" && prop.addressable === true) {
        addressablePropertyNames.push(name);
      }
    });
    NodeClass.static.addressablePropertyNames = addressablePropertyNames;
  }
}

function _compileSchema(schema) {
  var compiledSchema = {};
  each(schema, function(definition, name) {
    if (isString(definition) || isArray(definition)) {
      definition = { type: definition };
    }
    definition = _compileDefintion(definition);
    definition.name = name;
    compiledSchema[name] = definition;
  });
  return compiledSchema;
}

function _compileDefintion(definition) {
  var result = definition;
  if (isArray(definition.type) && definition[0] !== "array") {
    definition.type = [ "array", definition.type[0] ];
  } else if (definition.type === 'text') {
    result = {
      type: "string",
      addressable: true,
      default: ''
    };
  }
  return result;
}

function _unfoldedSchema(NodeClass, compiledSchema) {
  var schemas = [compiledSchema];
  var clazz = NodeClass;
  while(clazz) {
    var parentProto = Object.getPrototypeOf(clazz.prototype);
    if (!parentProto) {
      break;
    }
    clazz = parentProto.constructor;
    if (clazz && clazz.static && clazz.static.schema) {
      schemas.unshift(clazz.static.schema);
    }
  }
  schemas.unshift({});
  return extend.apply(null, schemas);
}

function _extractDefaultProps(NodeClass) {
  var unfoldedSchema = NodeClass.static.unfoldedSchema;
  var defaultProps = {};
  each(unfoldedSchema, function(prop, name) {
    if (prop.hasOwnProperty('default')) {
      defaultProps[name] = prop['default'];
    }
  });
  return defaultProps;
}

function _checked(prop, value) {
  var type;
  if (isArray(prop.type)) {
    type = "array";
  } else {
    type = prop.type;
  }
  if (value === null) {
    throw new Error('Value for property ' + prop.name + ' is null.');
  }
  if (value === undefined) {
    throw new Error('Value for property ' + prop.name + ' is undefined.');
  }
  if (type === "string" && !isString(value) ||
      type === "boolean" && !isBoolean(value) ||
      type === "number" && !isNumber(value) ||
      type === "array" && !isArray(value) ||
      type === "id" && !isString(value) ||
      type === "object" && !isObject(value)) {
    throw new Error('Illegal value type for property ' + prop.name + ': expected ' + type + ', was ' + (typeof value));
  }
  return value;
}

module.exports = Node;
