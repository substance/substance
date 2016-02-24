'use strict';

var annotationHelpers = require('../../model/annotationHelpers');
var deleteNode = require('../../model/transform/deleteNode');
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
    var self = this;

    surface.transaction(function(tx, args) {
      var newList;
      var container = tx.get(containerId);
      if (node.type === 'list-item') {
        var defaultType = tx.getSchema().getDefaultTextType();
        var id = uuid(defaultType);
        var parentList = tx.get(node.parent);
        var index = container.getChildIndex(parentList);
        var numItems = parentList.items.length;
        var nodeIndex = parentList.items.indexOf(node.id);
        tx.create({
          id: id,
          type: defaultType,
          content: node.content
        });
        // show the paragraph node and the second list node
        annotationHelpers.transferAnnotations(tx, path, 0, [id, 'content'], 0);
        container.show(id, index+1);
        // make a new list with the trailing items
        newList = tx.create({
          id: uuid('list'),
          type: parentList.type,
          items: parentList.items.slice(nodeIndex+1, numItems),
          ordered: parentList.ordered
        });
        var listElem;
        for (var i=0; i<newList.items.length; i++) {
          listElem = tx.get(newList.items[i]);
          listElem.parent = newList.id;
        }
        container.show(newList.id, index+2);
        // delete the trailing list items from the first list
        for (i=numItems-1; i>=nodeIndex; i--) {
          tx.update([parentList.id, 'items'], {delete: {offset: i}});
        }
        var selection = tx.createSelection({
          type: 'property',
          path: [id, 'content'],
          startOffset: 0
        });
        args.selection = selection;
      } else {
        // create a new list node
        newList = {
          id: uuid("list"),
          type: "list",
          ordered: self.ordered
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
        var pos = container.getPosition(node.id);
        // show the new list item and hide the old node
        container.show(newList.id, pos+1);
        container.hide(node.id);
        deleteNode(tx, {nodeId: node.id});
      }
      return args;
    });
    return true;
  };
};

SurfaceCommand.extend(ListCommand);

module.exports = ListCommand;
