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
  canEdit: function(annos, sel) {
    // jshint unused: false
    return annos.length === 1;
  },

  executeEdit: function() {
    var ctrl = this.getController();
    // Tells the link tool to show the edit prompt
    ctrl.emit('edit:link');
  },

  static: {
    name: 'toggleLink',
    annotationType: 'link'
  }
});

module.exports = ToggleLink;