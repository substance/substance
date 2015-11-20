'use strict';

var NodeRegistry = require('./data/NodeRegistry');

function DocumentNodeFactory(doc) {
  DocumentNodeFactory.super.call(this);

  this.doc = doc;

  doc.schema.each(function(NodeClass) {
    this.register(NodeClass);
  }.bind(this));
}

DocumentNodeFactory.Prototype = function() {

  this.create = function(nodeType, nodeData) {
    var NodeClass = this.get(nodeType);
    if (!NodeClass) {
      throw new Error('No Node registered by that name: ' + nodeType);
    }
    return new NodeClass(this.doc, nodeData);
  };

};

NodeRegistry.extend(DocumentNodeFactory);

module.exports = DocumentNodeFactory;
