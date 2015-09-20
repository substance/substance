'use strict';

var deleteSelection = require('./delete_selection');
var breakNode = require('./break_node');

function insertNode(tx, args) {
  var selection = args.selection;
  var node = args.node;
  if (!args.containerId) {
    throw new Error("containerId is mandatory");
  }
  if (!args.selection) {
    throw new Error("selection is mandatory");
  }
  if (!args.node) {
    throw new Error("node is mandatory");
  }
  var containerId = args.containerId;
  var container = tx.get(containerId);
  var tmp;
  if (!selection.isCollapsed()) {
    tmp = deleteSelection(tx, args);
    selection = tmp.selection;
  }
  tmp = breakNode(tx, args);
  selection = tmp.selection;
  // create the node if it does not exist yet
  // notice, that it is also allowed to insert an existing node
  if (!tx.get(node.id)) {
    node = tx.create(node);
  }
  // make sure we have the real node, not just its data
  node = tx.get(node.id);
  // insert the new node after the node where the cursor was
  var address = container.getAddress(selection.start.path);
  var pos = address[0];
  container.show(node.id, pos);
  // if possible set the selection to the first position in the inserted node
  var firstPath = container.getFirstPath(node);
  if (firstPath) {
    args.selection = tx.createSelection({
      type: 'property',
      path: firstPath,
      startOffset: 0
    });
  }
  return args;
}

module.exports = insertNode;
