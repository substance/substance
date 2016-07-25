'use strict';

var Registry = require('../../util/Registry');

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
  this.register = function (nodeClazz) {
    var type = nodeClazz.prototype.type;
    if ( typeof type !== 'string' || type === '' ) {
      console.error('#### nodeClazz', nodeClazz);
      throw new Error( 'Node names must be strings and must not be empty');
    }
    if ( !( nodeClazz.prototype._isNode) ) {
      throw new Error( 'Nodes must be subclasses of Substance.Data.Node' );
    }
    if (this.contains(type)) {
      throw new Error('Node class is already registered: ' + type);
    }
    this.add(type, nodeClazz);
  };

};

Registry.extend(NodeRegistry);

module.exports = NodeRegistry;
