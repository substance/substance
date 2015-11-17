'use strict';

var oo = require('../../util/oo');
var each = require('lodash/collection/each');
var extend = require('lodash/object/extend');
var uuid = require('../../util/uuid');
var EventEmitter = require('../../util/EventEmitter');

/**
  Base node implementation.

  @class Node
  @extends EventEmitter
  @param {Object} properties
 */
function Node(properties) {
  EventEmitter.call(this);

  var NodeClass = this.constructor;

  if (!NodeClass.static.name) {
    throw new Error('Every NodeClass must provide a static property "name".');
  }

  // integrity check for provided props
  each(NodeClass.static.schema, function(prop, name) {
    // mandatory properties
    if (prop.mandatory && !props.hasOwnProperty(name)) {
      throw new Error('Property ' + name + ' is mandatory for node type ' + this.type);
    }
  }, this);

  // filling in default values for properties which are not provided
  this.props = extend({}, NodeClass.defaultProps, props);
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

};

oo.inherit(Node, EventEmitter);

Node.static.defineSchema = function(schema) {
  // in ES6 we would just `this` which is bound to the class
  var NodeClass = this.__class__;
  // iterates over all properties in the schema and defines the property using Object.defineProperty
  _defineProperties(NodeClass);
  // collects a full schema considering the schemas of parent class
  // we will use the unfolded schema, check integrity of the given props (mandatory, readonly)
  // or fill in default values for undefined properties.
  NodeClass.static.unfoldedSchema = _unfoldedSchema(NodeClass);
  // computes the set of default properties only once
  NodeClass.static.defaultProps = _extractDefaultProps(NodeClass.unfoldedSchema);
};

/**
 * Symbolic name for this model class. Must be set to a unique string by every subclass.
 *
 * @static
 * @type {String}
 */
Node.static.name = "node";

/**
  @prop {String} id an id that is unique within this data
*/
Node.static.defineSchema({
  id: { type: 'string', required: true, readonly: true }
});

Object.defineProperty(Node.prototype, type, {
  configurable: false,
  get: function() {
    return this.constructor.name;
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

function _defineProperties(NodeClass) {
  each(NodeClass.static.schema, function(prop, name) {
    if (name === "type") {
      throw new Error("Property 'type' can not be used.");
    }
    // check if there is a name clash with prototype props
    if (NodeClass.prototype[name] !== undefined) {
      throw new Error('Name collision! ' + name);
    }
    if (prop.readonly) {
      var descriptor = {
        configurable: true,
      };
      descriptor.get = function() {
        return this.props[name];
      };
      descriptor.set = function() {
        throw new Error('Property ' + name + ' of node type ' + NodeClass.static.name + ' is read-only.');
      };
      Object.defineProperty(NodeClass.prototype, name, descriptor);
    }
  });
}

function _unfoldedSchema(NodeClass) {
  var schemas = [];
  var clazz = NodeClass;
  while(clazz) {
    if (clazz.static.schema) {
      schemas.unshift(clazz.static.schema);
    }
    var parentProto = Object.getPrototypeOf(clazz.prototype);
    if (!parentProto) {
      break;
    }
    clazz = parentProto.constructor;
  }
  schemas.unshift({});
  return extend.apply(null, schemas);
}

function _extractDefaultProps(unfoldedSchema) {
  var defaultProps = {};
  each(unfoldedSchema, function(prop, name) {
    if (prop.hasOwnProperty('default')) {
      defaultProps[name] = prop['default'];
    }
  });
  return defaultProps;
}

module.exports = Node;
