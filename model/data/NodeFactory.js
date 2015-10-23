'use strict';

var oo = require('../../util/oo');
var Factory = require('../../util/Factory');
var Node = require('./Node');

/**
 * Factory for Nodes.
 *
 * @class NodeFactory
 * @extends Factory
 *
 * @memberof module:Data
 */
function NodeFactory() {
  Factory.call(this);
}

NodeFactory.Prototype = function() {
  /**
   * Register a Node class.
   *
   * @method register
   * @param {Class} nodeClass
   *
   * @memberof module:Data.NodeFactory.prototype
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

oo.inherit(NodeFactory, Factory);

module.exports = NodeFactory;
