'use strict';

var SurfaceCommand = require('../../ui/SurfaceCommand');

var listUtils = require('./listUtils');


var ListCommand = function(surface) {
  SurfaceCommand.call(this, surface);
};

ListCommand.Prototype = function() {

  this.getSelection = function() {
    return this.getSurface().getSelection();
  };

  this.getCommandState = function() {
    var surface = this.getSurface();
    var sel = this.getSelection();
    var disabled = !surface.isEnabled() || sel.isNull() || !sel.isPropertySelection();

    var doc = this.getDocument();
    var path = sel.getPath();
    var node = doc.get(path[0]);

    var active = (node.type === 'list-item') && (node.ordered === this.ordered);

    return {
      active: active,
      disabled: disabled
    };
  };

  // Execute command and trigger transformations
  // TODO: This currently works for preoperty selection only. Make it work on container selection too.
  this.execute = function() {
    var sel = this.getSelection();
    if (!sel.isPropertySelection()) return;
    var doc = this.getDocument();
    var surface = this.getSurface();

    var path = sel.getPath();
    var node = doc.get(path[0]);
    var containerId = this.getContainerId();
    var self = this;

    surface.transaction(function(tx, args) {
      if (node.type === 'list-item') {
        if (node.ordered === self.ordered){
          // convert list item to paragraph
          var parentList = tx.get(node.parent);
          args.path = path;
          args.node = parentList;
          args.containerId = containerId;
          args = listUtils.listItemToParagraph(tx, args);
        } else {
          // switch list type between ordered and unordered list
          var items = tx.get([node.parent, 'items']);
          for (var i=0; i<items.length; i++){
            tx.set([items[i], 'ordered'], self.ordered);
          }
          tx.set([node.parent, 'ordered'], self.ordered);
        }
      } else {
        // convert node to list
        args.node = node;
        args.ordered = self.ordered;
        args.containerId = containerId;
        args.path = path;
        args.selection = sel;
        args = listUtils.paragraphToList(tx, args);
      }
      return args;
    });
    return true;
  };
};

SurfaceCommand.extend(ListCommand);

module.exports = ListCommand;
