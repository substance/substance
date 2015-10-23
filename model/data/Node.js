'use strict';

var oo = require('../../util/oo');
var _ = require('../../util/helpers');
var uuid = require('../../util/uuid');
var EventEmitter = require('../../util/EventEmitter');

/**
 * Base node implemention.
 *
 * @class Node
 * @extends EventEmitter
 * @param {Object} properties
 *
 * @memberof module:Data
 */
function Node( properties ) {
  EventEmitter.call(this);

  this.properties = _.extend({}, this.getDefaultProperties(), properties);
  this.properties.type = this.constructor.static.name;
  this.properties.id = this.properties.id || uuid(this.properties.type);

  this.didInitialize();
}

Node.Prototype = function() {

  /**
   * The node's schema.
   *
   * @property properties {Object}
   *
   * @memberof module:Data.Node.prototype
   */
  this.properties = {
    type: 'string',
    id: 'string'
  };

  this.didInitialize = function() {};

  /**
   * Serialize to JSON.
   *
   * @method toJSON
   * @return Plain object.
   *
   * @memberof module:Data.Node.prototype
   */
  this.toJSON = function() {
    return this.properties;
  };

  /**
   * Get default properties.
   *
   * Stub implementation.
   *
   * @method getDefaultProperties
   * @return An object containing default properties.
   *
   * @memberof module:Data.Node.prototype
   */
  this.getDefaultProperties = function() {};

  /**
   * Check if the node is of a given type.
   *
   * @method isInstanceOf
   * @param {String} typeName
   * @return true if the node has a parent with given type, false otherwise.
   *
   * @memberof module:Data.Node.prototype
   */
  this.isInstanceOf = function(typeName) {
    return Node.isInstanceOf(this.constructor, typeName);
  };

  /**
   * Get a the list of all polymorphic types.
   *
   * @method getTypeNames
   * @return An array of type names.
   *
   * @memberof module:Data.Node.prototype
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
   * @method getPropertyType
   * @param {String} propertyName
   * @return The property's type.
   *
   * @memberof module:Data.Node.prototype
   */
  this.getPropertyType = function(propertyName) {
    var schema = this.constructor.static.schema;
    return schema[propertyName];
  };

};

oo.inherit(Node, EventEmitter);

/**
 * Symbolic name for this model class. Must be set to a unique string by every subclass.
 * @static
 * @property name {String}
 *
 * @memberof module:Data.Node
 */
Node.static.name = "node";

/**
 * Read-only properties.
 *
 * @property readOnlyProperties {Array}
 * @static
 *
 * @memberof module:Data.Node
 */
// FIXME: this is not working. We can't rely on static attributes
// for defining node properties, as they will be defined when inherited
// If you really need it, make sure you call Node.static.initNodeClass(NodeClazz) afterwards
Node.static.readOnlyProperties = ['type', 'id'];

/**
 * Internal implementation of Node.prototype.isInstanceOf.
 *
 * @method isInstanceOf
 * @static
 * @private
 *
 * @memberof module:Data.Node
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

var defineProperty = function(prototype, property, readonly) {
  var getter, setter;
  getter = function() {
    return this.properties[property];
  };
  if (readonly) {
    setter = function() {
      throw new Error("Property " + property + " is readonly!");
    };
  } else {
    setter = function(val) {
      this.properties[property] = val;
      return this;
    };
  }
  var spec = {
    get: getter,
    set: setter
  };
  Object.defineProperty(prototype, property, spec);
};

var defineProperties = function(NodeClass) {
  var prototype = NodeClass.prototype;
  if (!NodeClass.static.schema) return;
  var properties = Object.keys(NodeClass.static.schema);
  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    if (prototype.hasOwnProperty(property)) continue;
    var readonly = ( NodeClass.static.readOnlyProperties &&
      NodeClass.static.readOnlyProperties.indexOf(property) > 0 );
    defineProperty(prototype, property, readonly);
  }
};

var prepareSchema = function(NodeClass) {
  var schema = NodeClass.static.schema;
  var parentStatic = Object.getPrototypeOf(NodeClass.static);
  var parentSchema = parentStatic.schema;
  if (parentSchema) {
    NodeClass.static.schema = _.extend(Object.create(parentSchema), schema);
  }
};

var initNodeClass = function(NodeClass, proto) {
  // when called via Node.extend we auto-magically copy the
  // properties into the static scope
  if (proto) {
    if (proto.properties) {
      NodeClass.static.schema = proto.properties;
    }
  } else {
    // TODO: we should use static.properties for sake of consistency
    if (NodeClass.prototype.hasOwnProperty('properties')) {
      NodeClass.static.schema = NodeClass.prototype.properties;
    }
  }
  defineProperties(NodeClass);
  prepareSchema(NodeClass);
  NodeClass.type = NodeClass.static.name;
};

Node.static.initNodeClass = initNodeClass;

// This makes a customized Node.extend() implementation, by overriding default
// key property names, and adding a post-processing hook.
// All subclasses will use this configuration.
oo.makeExtensible(Node, { "name": true, "displayName": true, "properties": true },
  initNodeClass
);

initNodeClass(Node);

module.exports = Node;
