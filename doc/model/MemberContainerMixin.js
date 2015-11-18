'use strict';

var oo = require('../../util/oo');
var filter = require('lodash/collection/filter');

function MemberContainerMixin() {}

MemberContainerMixin.Prototype = function() {

  this.getMembers = function(config) {
    config = config || {};
    var members = [];

    this.getMemberCategories().forEach(function(cat) {
      var catMembers = this.getCategoryMembers(cat, config);
      members = members.concat(catMembers);
    }.bind(this));
    return members;
  };

  this.getCategoryMembers = function(cat, config) {
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
  };

};

oo.initClass(MemberContainerMixin);

module.exports = MemberContainerMixin;
