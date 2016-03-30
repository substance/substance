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
var listItemsToParagraph = function(tx, args){
  var defaultType = tx.getSchema().getDefaultTextType();
  var id;
  var containerId = args.containerId;
  var container = tx.get(containerId);
  var index = container.getChildIndex(args.list);
  var numItems = args.list.items.length;
  var nodes = args.nodes;
  var nodeIndex = args.list.items.indexOf(args.nodes[0].id);
  for (var i=0; i<nodes.length; i++){
    id = uuid(defaultType);
    tx.create({
      id: id,
      type: defaultType,
      content: nodes[i].content
    });
    // show the paragraph node and the second list node
    annotationHelpers.transferAnnotations(tx, [nodes[i].id, 'content'], 0, [id, 'content'], 0);
    container.show(id, index+i+1);
  }

  if (args.list.items.slice(nodeIndex+nodes.length, numItems).length > 0){
    // make a new list with the trailing items
    var newList = tx.create({
      id: uuid('list'),
      type: args.list.type,
      items: args.list.items.slice(nodeIndex+nodes.length, numItems),
      ordered: args.list.ordered
    });
    for (i=0; i<newList.items.length; i++) {
      tx.set([newList.items[i], 'parent'], newList.id);
    }
    container.show(newList.id, index+nodes.length+1);
  }
  // delete the trailing list items from the first list
  for (var j=numItems-1; j>=nodeIndex; j--) {
    tx.update([args.list.id, 'items'], {delete: {offset: j}});
  }
  // if list has no items left, delete it
  if (tx.get([args.list.id, 'items']).length === 0) deleteNode(tx, {nodeId: args.list.id});
  var selection = tx.createSelection({
    type: 'property',
    path: [id, 'content'],
    startOffset: 0
  });
  args.selection = selection;
  return args;
};

var paragraphsToList = function(tx, args) {
  var container = tx.get(args.containerId);
  // create a new list node
  var newList = {
    id: uuid("list"),
    type: "list",
    ordered: args.ordered
  };
  var items = [];
  var newListItem;
  // and a new list item node, set its parent to the list node
  for (var i=0; i<args.nodes.length; i++){
    newListItem = {
      id: uuid("list-item"),
      parent: newList.id,
      ordered: newList.ordered,
      content: args.nodes[i].content,
      type: "list-item"
    };
    // create the nodes
    tx.create(newListItem);
    items.push(newListItem.id);
    var newPath = [newListItem.id, 'content'];
    // transfer annotations from the current node to new list item
    annotationHelpers.transferAnnotations(tx, [args.nodes[i].id, 'content'], 0, newPath, 0);
  }
  newList.items = items;
  tx.create(newList);
  var pos = container.getPosition(args.nodes[0].id);
  // show the new list item and hide the old node
  container.show(newList.id, pos+1);
  for (i=0; i<args.nodes.length; i++){
    deleteNode(tx, {nodeId: args.nodes[i].id});
  }
  var selection = tx.createSelection({
    type: 'property',
    path: [newListItem.id, 'content'],
    startOffset: args.selection.startOffset
  });
  args.selection = selection;
  return args;
};

module.exports = {
  listItemsToParagraph: listItemsToParagraph,
  paragraphsToList: paragraphsToList
};
