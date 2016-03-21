'use strict';

var uuid = require('../../util/uuid');
var deleteNode = require('../../model/transform/deleteNode');

var annotationHelpers = require('../../model/annotationHelpers');

/**
  convert the list item into a paragraph and split the list
  into 2 lists.

  @function

  @param {model/TransactionDocument} tx the document instance
  @param {Object} args object with fields `node`, `containerId`, `path`
*/
var listItemToParagraph = function(tx, args){
  var defaultType = tx.getSchema().getDefaultTextType();
  var id = uuid(defaultType);
  var containerId = args.containerId;
  var container = tx.get(containerId);
  var index = container.getChildIndex(args.node);
  var numItems = args.node.items.length;
  var node = tx.get(args.path[0]);
  var nodeIndex = args.node.items.indexOf(args.path[0]);
  tx.create({
    id: id,
    type: defaultType,
    content: node.content
  });
  // show the paragraph node and the second list node
  annotationHelpers.transferAnnotations(tx, args.path, 0, [id, 'content'], 0);
  container.show(id, index+1);
  if (args.node.items.slice(nodeIndex+1, numItems).length > 0){
    // make a new list with the trailing items
    var newList = tx.create({
      id: uuid('list'),
      type: args.node.type,
      items: args.node.items.slice(nodeIndex+1, numItems),
      ordered: args.node.ordered
    });
    for (var i=0; i<newList.items.length; i++) {
      tx.set([newList.items[i], 'parent'], newList.id);
    }
    container.show(newList.id, index+2);
  }
  // delete the trailing list items from the first list
  for (var j=numItems-1; j>=nodeIndex; j--) {
    tx.update([args.node.id, 'items'], {delete: {offset: j}});
  }
  // if list has no items left, delete it
  if (tx.get([args.node.id, 'items']).length === 0) deleteNode(tx, {nodeId: node.id});
  var selection = tx.createSelection({
    type: 'property',
    path: [id, 'content'],
    startOffset: 0
  });
  args.selection = selection;
  return args;
};

var paragraphToList = function(tx, args) {
  var container = tx.get(args.containerId);
  // create a new list node
  var newList = {
    id: uuid("list"),
    type: "list",
    ordered: args.ordered
  };
  // and a new list item node, set its parent to the list node
  var newListItem = {
    id: uuid("list-item"),
    parent: newList.id,
    ordered: newList.ordered,
    content: args.node.content,
    type: "list-item"
  };
  // create the nodes
  tx.create(newListItem);
  newList.items = [newListItem.id];
  tx.create(newList);
  var newPath = [newListItem.id, 'content'];
  // transfer annotations from the current node to new list item
  annotationHelpers.transferAnnotations(tx, args.path, 0, newPath, 0);
  var pos = container.getPosition(args.node.id);
  // show the new list item and hide the old node
  container.show(newList.id, pos+1);
  deleteNode(tx, {nodeId: args.node.id});
  var selection = tx.createSelection({
    type: 'property',
    path: [newListItem.id, 'content'],
    startOffset: args.selection.startOffset
  });
  args.selection = selection;
  return args;
};

module.exports = {
  listItemToParagraph: listItemToParagraph,
  paragraphToList: paragraphToList
};
