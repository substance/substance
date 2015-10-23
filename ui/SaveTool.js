'use strict';

var ControllerTool = require('./ControllerTool');
var SaveTool = ControllerTool.extend({

  static: {
    name: 'save',
    command: 'save'
  },

  // initialize: function() {
  //   var ctrl = this.getController();
  //   ctrl.connect(this, {
  //     'document:saved': this.update
  //   });
  // },

});

module.exports = SaveTool;
