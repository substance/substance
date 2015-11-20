'use strict';

var Registry = require('../../util/Registry');
var Node = require('./Node');

/**
  Registry for Nodes.

  @class NodeRegistry
  @extends util/Registry
 */
function NodeRegistry() {
  Registry.call(this);
}

NodeRegistry.Prototype = function() {

  /**
    Register a Node class.

    @param {Class} nodeClass
   */
  this.register = function ( nodeClazz ) {
    var name = nodeClazz.static && nodeClazz.static.name;
    if ( typeof name !== 'string' || name === '' ) {
      throw new Error( 'Node names must be strings and must not be empty' );
    }
    if ( !( nodeClazz.prototype instanceof Node) ) {
      throw new Error( 'Nodes must be subclasses of Substance.Data.Node' );
    }
    if (this.contains(name)) {
      throw new Error('Node class is already registered: ' + name);
    }
    this.add(name, nodeClazz);
  };

};

Registry.extend(NodeRegistry);

module.exports = NodeRegistry;
