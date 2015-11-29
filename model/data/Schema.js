'use strict';

var oo = require('../../util/oo');
var NodeRegistry = require('./NodeRegistry');
var Node = require('./Node');

/**
  Schema for Data Objects.

  @class Schema
  @private
 */

/**
  @constructor Schema
  @param {String} name
  @param {String} version
*/
function Schema(name, version) {
  /**
    @type {String}
  */
  this.name = name;
  /**
    @type {String}
  */
  this.version = version;
  /**
    @type {NodeRegistry}
    @private
  */
  this.nodeRegistry = new NodeRegistry();
  /**
    @type {Array} all Node classes which have `Node.static.tocType = true`
    @private
  */
  this.tocTypes = [];

  // add built-in node classes
  this.addNodes(this.getBuiltIns());
}

Schema.Prototype = function() {

  /**
    Add nodes to the schema.

    @param {Array} nodes Array of Node classes
  */
  this.addNodes = function(nodes) {
    if (!nodes) return;
    for (var i = 0; i < nodes.length; i++) {
      var NodeClass = nodes[i];
      // FIXME: there is some rubish coming in
      if (!NodeClass.static) {
        console.log('AAAAAAA', NodeClass);
        continue;
      }
      this.addNode(NodeClass);
    }
  };

  this.addNode = function(NodeClass) {
    this.nodeRegistry.register(NodeClass);
    if (NodeClass.static.tocType) {
      this.tocTypes.push(NodeClass.static.name);
    }
  };

  /**
    Get the node class for a type name.

    @param {String} name
    @returns {Class}
  */
  this.getNodeClass = function(name) {
    return this.nodeRegistry.get(name);
  };

  /**
    Provide all built-in node classes.

    @private
    @returns {Node[]} An array of Node classes.
  */
  this.getBuiltIns = function() {
    return [ Node ];
  };

  /**
    Checks if a given type is of given parent type.

    @param {String} type
    @param {String} parentType
    @returns {Boolean} true if `(type instanceof parentType)`.
  */
  this.isInstanceOf = function(type, parentType) {
    var NodeClass = this.getNodeClass(type);
    if (NodeClass) {
      return Node.static.isInstanceOf(NodeClass, parentType);
    }
    return false;
  };

  /**
    Iterate over all registered node classes.

    See {@link util/Registry#each}

    @param {Function} callback
    @param {Object} context
  */
  this.each = function() {
    this.nodeRegistry.each.apply(this.nodeRegistry, arguments);
  };

  /**
    @returns {Node[]} list of types that should appear in a TOC
  */
  this.getTocTypes = function() {
    return this.tocTypes;
  };

  /**
    @returns {String} the name of the default textish node (e.g. 'paragraph')
  */
  this.getDefaultTextType = function() {
    throw new Error('Schmema.prototype.getDefaultTextType() must be overridden.');
  };

  this.getNodeSchema = function(type) {
    var NodeClass = this.getNodeClass(type);
    if (!NodeClass) {
      console.error('Unknown node type ', type);
      return null;
    }
    return _getNodeSchema(NodeClass);
  };

  var _getNodeSchema = function(NodeClass) {
    return NodeClass.static.schema;
  };

};

oo.initClass(Schema);

module.exports = Schema;
