'use strict';

var oo = require('../../util/oo');
var Document = require('../../model/Document');
var Schema = require('../../model/DocumentSchema');
var schema = new Schema("substance-documentation", "0.1.0");

schema.addNodes([
  require('./ClassNode'),
  require('./MethodNode'),
  require('./FunctionNode'),
  require('./NamespaceNode'),
  require('./PropertyNode'),
  require('./MetaNode'),
  require('./ComponentNode'),
  require('./ObjectNode')
]);

var Documentation = function() {
  Document.call(this, schema);
  
  this.create({
    type: "container",
    id: "body",
    nodes: []
  });
};

Documentation.Prototype = function() {
this.getTOCNodes = function() {
    var tocNodes = [];
    var contentNodes = this.get('body').nodes;
    contentNodes.forEach(function(nodeId) {
      var node = this.get(nodeId);
      if (node.type === "heading") {
        tocNodes.push(node);
      }
    }.bind(this));
    return tocNodes;
  };
};

oo.inherit(Documentation, Document);
Documentation.schema = schema;

module.exports = Documentation;
