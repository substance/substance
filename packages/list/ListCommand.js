'use strict';

var annotationHelpers = require('../../model/annotationHelpers');
var SurfaceCommand = require('../../ui/SurfaceCommand');
var uuid = require('../../util/uuid');


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

    return {
      active: true,
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
    var content = node.content;
    var containerId = this.getContainerId();

    surface.transaction(function(tx, args) {
      // create a new list node
      var newList = {
        id: uuid("list"),
        type: "list"
      };
      // and a new list item node, set its parent to the list node
      var newListItem = {
        id: uuid("list-item"),
        parent: newList.id,
        content: content,
        type: "list-item"
      };
      // create the nodes
      tx.create(newListItem);
      newList.items = [newListItem.id];
      tx.create(newList);
      var newPath = [newListItem.id, 'content'];
      // transfer annotations from the current node to new list item
      annotationHelpers.transferAnnotations(tx, path, 0, newPath, 0);
      var container = tx.get(containerId);
      var pos = container.getPosition(node.id);
      // show the new list item and hide the old node
      container.show(newList.id, pos+1);
      container.hide(node.id);
      console.log(args);
      return args;
    });
  };
};

SurfaceCommand.extend(ListCommand);

ListCommand.static.name = 'list';

module.exports = ListCommand;
