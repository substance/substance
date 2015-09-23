'use strict';

var AnnotationCommand = require('./toggle_annotation');

var ToggleLink = AnnotationCommand.extend({
  getAnnotationData: function() {
    return {
      url: "",
      title: ""
    };
  },

  // When there's some overlap with only a single annotation we do an expand
  canEdit: function(annos, sel) {
    // jshint unused: false
    return annos.length === 1;
  },

  static: {
    name: 'toggleLink',
    annotationType: 'link'
  }
});

module.exports = ToggleLink;