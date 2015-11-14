'use strict';

var oo = require('../../util/oo');
var Document = require('../../model/Document');
var Schema = require('../../model/DocumentSchema');
var schema = new Schema('substance-documentation', '0.1.0');

schema.addNodes([
  require('./MetaNode'),
  require('./NamespaceNode'),
  require('./ModuleNode'),
  require('./FunctionNode'),
  require('./ClassNode'),
  require('./MethodNode'),
  require('./PropertyNode'),
  require('./EventNode'),
]);

var Documentation = function() {
  Document.call(this, schema);

  this.create({
    type: 'container',
    id: 'body',
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

Documentation.getNodeInfo = function(node) {
  var info = {
    isClassMember: false,
    isModuleMember: false,
    isConstructor: false,
    storage: '',
    typeDescr: ''
  };

  var hasParent = node.hasParent();
  var parent;
  if (hasParent) {
    parent = node.getParent();
    info.isClassMember = (parent.type === 'class');
    info.isModuleMember = (parent.type === 'module');
  }
  if (node.type === 'class') {
    info.isConstructor = true;
  }

  // Derive storage
  if (info.isConstructor) {
    info.storage = 'new ';
  } else if (info.isClassMember && !node.isStatic) {
    info.storage = 'this.';
  } else if (info.isModuleMember) {
    info.storage = parent.name + '.';
  }

  // Derive typeDescr
  if (info.isConstructor) {
    info.typeDescr = 'Constructor';
  } else if (info.isClassMember || info.isModuleMember) {
    if (node.isStatic) {
      info.typeDescr = 'Static Method';
    } else {
      info.typeDescr = 'Method';
    }
  }
  return info;
};

module.exports = Documentation;
