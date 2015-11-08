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
  require('./ModuleNode')
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
    var doc = this;
    var contentNodes = this.get('body').nodes;
    contentNodes.forEach(function(nsId) {
      var ns = this.get(nsId);
      tocNodes.push(ns);

      var nsMembers = doc.getMembers(ns);
      nsMembers.forEach(function(member) {
        tocNodes.push(member);
        if (member.type === "class" || member.type === "module") {
          tocNodes = tocNodes.concat(doc.getMembers(member));
        }
      });

    }.bind(this));
    return tocNodes;
  };

  this.getMembers = function(node) {
    var members = [];
    if (node.members) {
      var doc = this;
      node.members.forEach(function(memberId) {
        var member = doc.get(memberId);
        if (member) {
          members.push(member);
        }
      });
    }
    return members;
  };
};

oo.inherit(Documentation, Document);
Documentation.schema = schema;

module.exports = Documentation;
