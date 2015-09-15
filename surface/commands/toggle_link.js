'use strict';

var AnnotationCommand = require('./toggle_annotation');

var ToggleLink = AnnotationCommand.extend({
  afterCreate: function() {
    this.executeEdit();
  },

  getAnnotationData: function() {
    return {
      url: "",
      title: ""
    };
  },

  // When there's some overlap with only a single annotation we do an expand
  canEdit: function(annos/*, sel*/) {
    return annos.length === 1;
  },

  executeEdit: function() {
    var doc = this.getDocument();
    doc.emit('app:edit:link');
  },

  static: {
    name: 'toggleLink',
    annotationType: 'link'
  }
});

module.exports = ToggleLink;