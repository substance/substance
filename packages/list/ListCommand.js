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
    var content = node.content;
    var containerId = this.getContainerId();
    var self = this;

    // define behavior when the list tool is clicked while the current selection
    // is a list item.
    //TODO: this is very similar to mergeListItems. See if we can resuse that
    var listToText = function(tx, args) {
      var newList;
      var container = tx.get(containerId);
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
      if (parentList.items.slice(nodeIndex+1, numItems).length > 0){
        // make a new list with the trailing items
        newList = tx.create({
          id: uuid('list'),
          type: parentList.type,
          items: parentList.items.slice(nodeIndex+1, numItems),
          ordered: parentList.ordered
        });
        for (var i=0; i<newList.items.length; i++) {
          tx.set([newList.items[i], 'parent'], newList.id);
        }
        container.show(newList.id, index+2);
      }
      // delete the trailing list items from the first list
      for (var j=numItems-1; j>=nodeIndex; j--) {
        tx.update([parentList.id, 'items'], {delete: {offset: j}});
      }
      var selection = tx.createSelection({
        type: 'property',
        path: [id, 'content'],
        startOffset: sel.startOffset
      });
      args.selection = selection;
      return args;
    };

    // define behavior when the list tool is clicked while the current selection
    // is a text item.
    var textToList = function(tx, args) {
      var container = tx.get(containerId);
      // create a new list node
      var newList = {
        id: uuid("list"),
        type: "list",
        ordered: self.ordered
      };
      // and a new list item node, set its parent to the list node
      var newListItem = {
        id: uuid("list-item"),
        parent: newList.id,
        ordered: newList.ordered,
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
      deleteNode(tx, {nodeId: node.id});
      var selection = tx.createSelection({
        type: 'property',
        path: [newListItem.id, 'content'],
        startOffset: sel.startOffset
      });
      args.selection = selection;
      return args;
    };

    surface.transaction(function(tx, args) {
      if (node.type === 'list-item') {
        if (node.ordered === self.ordered){
          args = listToText(tx, args);
        } else {
          // switch list type between ordered and unordered list
          var items = tx.get([node.parent, 'items']);
          for (var i=0; i<items.length; i++){
            tx.set([items[i], 'ordered'], self.ordered);
          }
          tx.set([node.parent, 'ordered'], self.ordered);
        }
      } else {
        args = textToList(tx, args);
      }
      return args;
    });
    return true;
  };
};

SurfaceCommand.extend(ListCommand);

module.exports = ListCommand;
