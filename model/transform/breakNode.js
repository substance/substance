'use strict';

var uuid = require('../../util/uuid');
var deleteSelection = require('./deleteSelection');
var annotationHelpers = require('../annotationHelpers');

/* jshint latedef: false */

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
  var node = tx.get(sel.start.path[0]);
  var behavior = args.editingBehavior;
  if (node.isInstanceOf('text')) {
    return breakTextNode(tx, args);
  } else if (behavior && behavior.canBreak(node.type)) {
    var breaker = behavior.getBreaker(node.type);
    return breaker.call(breaker, tx, args);
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
  var text = node.content;
  var container = tx.get(containerId);
  var nodePos = container.getChildIndex(node);
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
  // otherwise a default text type node is inserted
  else {
    newNode = node.toJSON();
    newNode.id = id;
    newNode.content = text.substring(offset);
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

module.exports = breakNode;
