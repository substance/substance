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
  var comp = container.getComponent(selection.start.path);
  var pos = container.getPosition(comp.rootId);
  container.show(node.id, pos);
  // if possible set the selection to the first position in the inserted node
  var comps = container.getComponentsForNode(node.id);
  if (comps.length > 0) {
    args.selection = tx.createSelection({
      type: 'property',
      path: comps[0].getPath(),
      startOffset: 0
    });
  }
  return args;
}

module.exports = insertNode;
