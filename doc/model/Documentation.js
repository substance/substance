'use strict';

var each = require('lodash/collection/each');
var Document = require('../../model/Document');
var Schema = require('../../model/DocumentSchema');
var schema = new Schema('substance-documentation', '0.1.0');

var MemberIndex = require('./MemberIndex');

schema.addNodes([
  require('./MetaNode'),
  require('./NamespaceNode'),
  require('./ModuleNode'),
  require('./FunctionNode'),
  require('./SubstanceClassNode'),
  require('./ConstructorNode'),
  require('./MethodNode'),
  require('./PropertyNode'),
  require('./EventNode'),
]);

schema.getDefaultTextType = function() {
  return null;
};

schema.getTocTypes = function() {
  return ['namespace', 'class', 'function', 'module'];
};

var Documentation = function() {
  Document.call(this, schema);

  this.addIndex('members', new MemberIndex(this));
  this.create({
    type: 'container',
    id: 'body',
    nodes: []
  });
};

Documentation.Prototype = function() {

  // Takes a config object from the app context
  this.getTOCNodes = function(config) {
    config = config || {};
    var tocNodes = [];
    var contentNodes = this.get('body').nodes;
    contentNodes.forEach(function(nsId) {
      var ns = this.get(nsId);
      tocNodes.push(ns);
      each(ns.getMemberCategories(), function(cat) {
        var catMembers = ns.getCategoryMembers(cat, config);
        tocNodes = tocNodes.concat(catMembers);
      });
    }.bind(this));
    return tocNodes;
  };
};

Document.extend(Documentation);
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

  if (node.type === 'ctor') {
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
