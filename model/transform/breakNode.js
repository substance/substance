'use strict';

import uuid from '../../util/uuid'
import deleteSelection from './deleteSelection'
import annotationHelpers from '../annotationHelpers'

/**
  A transformation that breaks a node at the current position,
  e.g. used when you hit ENTER inside a paragraph.

  @function

  @param {model/TransactionDocument} tx the document instance
  @param {Object} args object with fields `selection`, `containerId`
*/
function breakNode(tx, args) {
  if (!args.selection) {
    throw new Error("Argument 'selection' is mandatory.");
  }
  if (!args.containerId) {
    throw new Error("Argument 'containerId' is mandatory.");
  }
  if (!args.selection.isCollapsed()) {
    args = deleteSelection(tx, args);
  }
  var sel = args.selection;

  // default breaking behavior for node selections
  if (sel.isNodeSelection()) {
    if (!sel.isFull()) {
      return breakWholeNode(tx, args);
    } else {
      return args;
    }
  }

  var node = tx.get(sel.start.path[0]);
  var behavior = args.editingBehavior;

  if (behavior && behavior.canBreak(node.type)) {
    var breaker = behavior.getBreaker(node.type);
    return breaker.call(breaker, tx, args);
  } else if (node.isText()) {
    return breakTextNode(tx, args);
  } else {
    console.info("Breaking is not supported for node type %s.", node.type);
    return args;
  }
}

function breakTextNode(tx, args) {
  var sel = args.selection;
  var containerId = args.containerId;
  if (!sel.isPropertySelection()) {
    throw new Error('Expected property selection.');
  }
  var path = sel.path;
  var offset = sel.startOffset;
  var node = tx.get(path[0]);

  // split the text property and create a new paragraph node with trailing text and annotations transferred
  var text = node.getText();
  var container = tx.get(containerId);
  var nodePos = container.getPosition(node.id);
  var id = uuid(node.type);
  var newPath = [id, 'content'];
  var newNode;
  // when breaking at the first position, a new node of the same
  // type will be inserted.
  if (offset === 0) {
    newNode = tx.create({
      id: id,
      type: node.type,
      content: ""
    });
    // show the new node
    container.show(id, nodePos);
    sel = tx.createSelection(path, 0);
  }
  // otherwise break the node
  else {
    newNode = node.toJSON();
    newNode.id = id;
    newNode.content = text.substring(offset);
    // if at the end
    if (offset === text.length) {
      newNode.type = tx.getSchema().getDefaultTextType();
    }
    tx.create(newNode);
    // create a new node
    if (offset < text.length) {
      // transfer annotations which are after offset to the new node
      annotationHelpers.transferAnnotations(tx, path, offset, [id, 'content'], 0);
      // truncate the original property
      tx.update(path, {
        delete: { start: offset, end: text.length }
      });
    }
    // show the new node
    container.show(id, nodePos+1);
    // update the selection
    sel = tx.createSelection(newPath, 0);
  }
  args.selection = sel;
  args.node = newNode;
  return args;
}

function breakWholeNode(tx, args) {
  var sel = args.selection;
  var containerId = args.containerId;
  if (!sel) {
    throw new Error('Illegal argument: selection is mandatory.');
  }
  if (!containerId) {
    throw new Error('Illegal argument: containerId is mandatory.');
  }
  if (!sel.isNodeSelection()) {
    throw new Error('Illegal argument: selection should be a NodeSelection');
  }
  var container = tx.get(containerId);
  var nodeId = sel.getNodeId();
  var nodePos = container.getPosition(nodeId);
  var type = tx.getSchema().getDefaultTextType();
  var newNode = tx.create({
    type: type,
    content: ""
  });
  var newSel;
  if (sel.isBefore()) {
    container.show(newNode.id, nodePos);
    // in this case the selection does not change
    newSel = sel;
  } else {
    container.show(newNode.id, nodePos+1);
    newSel = tx.createSelection([newNode.id, 'content'], 0);
  }
  args.selection = newSel;
  args.node = newNode;
  return args;
}

export default breakNode;
