'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

function LinkCommand() {
  LinkCommand.super.apply(this, arguments);
}

LinkCommand.Prototype = function() {

  this.getAnnotationData = function() {
    return {
      url: ""
    };
  };

  this.canFuse = function() {
    return false;
  };

  // When there's some overlap with only a single annotation we do an expand
  this.canEdit = function(annos, sel) { // eslint-disable-line
    return annos.length === 1;
  };

  this.canDelete = function(annos, sel) { // eslint-disable-line
    return false;
  };

};

AnnotationCommand.extend(LinkCommand);

module.exports = LinkCommand;
