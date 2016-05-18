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

  // When there's some overlap with only a single annotation we do an expand
  this.canEdit = function(annos, sel) {
    // jshint unused: false
    return annos.length === 1;
  };

  this.canDelete = function(annos, sel) {
    // jshint unused: false
    return false;
  };

};

AnnotationCommand.extend(LinkCommand);

LinkCommand.static.name = 'link';
LinkCommand.static.annotationType = 'link';

module.exports = LinkCommand;