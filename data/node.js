'use strict';

var Substance = require('../basics');
var EventEmitter = Substance.EventEmitter;

/**
 * Base node implemention.
 *
 * @class Data.Node
 * @extends EventEmitter
 * @constructor
 * @param {Object} properties
 * @module Data
 */
function Node( properties ) {
  EventEmitter.call(this);

  /**
   * The internal storage for properties.
   * @property properties {Object}
   */
  this.properties = Substance.extend({}, this.getDefaultProperties(), properties);
  this.properties.type = this.constructor.static.name;
  this.properties.id = this.properties.id || Substance.uuid(this.properties.type);
}

Node.Prototype = function() {

  /**
   * Serialize to JSON.
   *
   * @method toJSON
   * @return Plain object.
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
   */
  this.getDefaultProperties = function() {};

  /**
   * Check if the node is of a given type.
   *
   * @method isInstanceOf
   * @param {String} typeName
   * @return true if the node has a parent with given type, false otherwise.
   */
  this.isInstanceOf = function(typeName) {
    return Node.isInstanceOf(this.constructor, typeName);
  };

  /**
   * Get a the list of all polymorphic types.
   *
   * @method getTypeNames
   * @return An array of type names.
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
   */
  this.getPropertyType = function(propertyName) {
    var schema = this.constructor.static.schema;
    return schema[propertyName];
  };

};

Substance.inherit(Node, EventEmitter);

/**
 * Symbolic name for this model class. Must be set to a unique string by every subclass.
 * @static
 * @property name {String}
 */
Node.static.name = "node";

/**
 * The node schema.
 *
 * @property schema {Object}
 * @static
 */
Node.static.schema = {
  type: 'string',
  id: 'string'
};

/**
 * Read-only properties.
 *
 * @property readOnlyProperties {Array}
 * @static
 */
Node.static.readOnlyProperties = ['type', 'id'];

/**
 * Internal implementation of Node.prototype.isInstanceOf.
 *
 * @method isInstanceOf
 * @static
 * @private
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

var extend;

var prepareSchema = function(NodeClass) {
  var schema = NodeClass.static.schema;
  var parentStatic = Object.getPrototypeOf(NodeClass.static);
  var parentSchema = parentStatic.schema;
  if (parentSchema) {
    NodeClass.static.schema = Substance.extend(Object.create(parentSchema), schema);
  }
};

var initNodeClass = function(NodeClass) {
  // add a extend method so that this class can be used to create child models.
  NodeClass.extend = Substance.bind(extend, null, NodeClass);
  // define properties and so on
  defineProperties(NodeClass);
  prepareSchema(NodeClass);
  NodeClass.type = NodeClass.static.name;
};

extend = function( parent, modelSpec ) {
  var ctor = function NodeClass() {
    parent.apply(this, arguments);
    if (this.init) {
      this.init.apply(this, arguments);
    }
  };
  Substance.inherit(ctor, parent);
  for(var key in modelSpec) {
    if (modelSpec.hasOwnProperty(key)) {
      if (key === "name" || key === "properties") {
        continue;
      }
      ctor.prototype[key] = modelSpec[key];
    }
  }
  ctor.static.name = modelSpec.name;
  ctor.static.schema = modelSpec.properties;
  initNodeClass(ctor);
  return ctor;
};

initNodeClass(Node);

Node.initNodeClass = initNodeClass;

module.exports = Node;
