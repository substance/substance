'use strict';

import oo from '../util/oo'

function DocumentNodeFactory(doc) {
  this.doc = doc;
}

DocumentNodeFactory.Prototype = function() {

  this.create = function(nodeType, nodeData) {
    var NodeClass = this.doc.schema.getNodeClass(nodeType);
    if (!NodeClass) {
      throw new Error('No node registered by that name: ' + nodeType);
    }
    return new NodeClass(this.doc, nodeData);
  };

};

oo.initClass(DocumentNodeFactory);

export default DocumentNodeFactory;
