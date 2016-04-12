'use strict';

var SurfaceCommand = require('../../ui/SurfaceCommand');


var ListDedentCommand = function(surface) {
  SurfaceCommand.call(this, surface);
};

ListDedentCommand.Prototype = function() {

  this.getSelection = function() {
    return this.getSurface().getSelection();
  };

  this.getCommandState = function() {
    var sel = this.getSelection();
    var doc = this.getDocument();
    var enabled = false;

    if (sel.isPropertySelection()){
      var path = sel.getPath();
      var node = doc.get(path[0]);
      enabled = (node.type === 'list-item') && (node.level > 1);
    }

    return {
      active: false,
      disabled: !enabled
    };
  };

  this.execute = function() {
    var sel = this.getSelection();
    var doc = this.getDocument();
    var surface = this.getSurface();
    var path = sel.getPath();
    var node = doc.get(path[0]);

    surface.transaction(function(tx, args) {
      if (node.type === 'list-item') {
        tx.set([node.id, 'level'], node.level-1);
      }
      return args;
    });
    return true;
  };
};

SurfaceCommand.extend(ListDedentCommand);
ListDedentCommand.static.name = 'dedent-list-item';

module.exports = ListDedentCommand;
