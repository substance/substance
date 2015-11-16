'use strict';

var Node = require('../../model/DocumentNode');
var filter = require('lodash/collection/filter');

var DocumentedNode = Node.extend({
  name: 'source-code',
  properties: {
    description: 'string', // HTML
    example: 'string', // HTML
    sourceFile: 'string', // ui/Component.js
    sourceLine: 'number',
    tags: ['array', 'object'], // [ { name: 'type', string: '...', html: '...'}]
  },

  // Defaults to the regular type property
  getSpecificType: function() {
    return this.type;
  },
  
  getTocName: function() {
    return this.name;
  },

  // ContainerNode API
  // ---------------------
  // 
  // Nodes that have a members property

  getMembers: function(config) {
    config = config || {};
    var members = [];

    this.getMemberCategories().forEach(function(cat) {
      var catMembers = this.getCategoryMembers(cat, config);
      members = members.concat(catMembers);
    }.bind(this));
    return members;
  },

  getCategoryMembers: function(cat, config) {
    var doc = this.getDocument();
    var memberIndex = doc.getIndex('members');
    var members = memberIndex.get([this.id].concat(cat.path));
    members = filter(members, function(memberNode) {
      // skip nodes according to configuration
      if ((memberNode.type === "method" && memberNode.isPrivate && config.skipPrivateMethods) ||
        (memberNode.type === "class" && memberNode.isAbstract && config.skipAbstractClasses)) {
        return false;
      }
      return true;
    });
    return members;
  }
  
});

DocumentedNode.static.blockType = true;

module.exports = DocumentedNode;
