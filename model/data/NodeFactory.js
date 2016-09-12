'use strict';

import oo from '../../util/oo'

function NodeFactory(nodeRegistry) {
  this.nodeRegistry = nodeRegistry;
}

NodeFactory.Prototype = function() {

  this.create = function(nodeType, nodeData) {
    var NodeClass = this.nodeRegistry.get(nodeType);
    if (!NodeClass) {
      throw new Error('No Node registered by that name: ' + nodeType);
    }
    return new NodeClass(nodeData);
  };

};

oo.initClass(NodeFactory);

export default NodeFactory;
