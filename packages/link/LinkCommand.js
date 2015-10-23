'use strict';

var AnnotationCommand = require('../../ui/AnnotationCommand');

var LinkCommand = AnnotationCommand.extend({
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
    name: 'link',
    annotationType: 'link'
  }
});

module.exports = LinkCommand;