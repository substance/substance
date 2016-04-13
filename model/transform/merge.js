/* jshint latedef: false */
'use strict';

var extend = require('lodash/extend');
var annotationHelpers = require('../annotationHelpers');

var merge = function(tx, args) {
  var containerId = args.containerId;
  var path = args.path;
  var direction = args.direction;
  if (!containerId||!path||!direction) {
    throw new Error('Insufficient arguments! mandatory fields: `containerId`, `path`, `direction`');
  }
  var container = tx.get(containerId);
  var nodeId = path[0];
  var nodePos = container.getPosition(nodeId);
  var l = container.getLength();
  var tmp;
  if (direction === 'right' && nodePos < l-1) {
    var nextNodeId = container.nodes[nodePos+1];
    tmp = _mergeNodes(tx, extend({}, args, {
      containerId: containerId,
      firstNodeId: nodeId,
      secondNodeId: nextNodeId
    }));
    args.selection = tmp.selection;
  } else if (direction === 'left' && nodePos > 0) {
    var previousNodeId = container.nodes[nodePos-1];
    tmp = _mergeNodes(tx, extend({}, args, {
      containerId: containerId,
      firstNodeId: previousNodeId,
      secondNodeId: nodeId
    }));
    args.selection = tmp.selection;
  }
  return args;
};

var _mergeNodes = function(tx, args) {
  var firstNodeId = args.firstNodeId;
  var secondNodeId = args.secondNodeId;
  var firstNode = tx.get(firstNodeId);
  var secondNode = tx.get(secondNodeId);
  // most often a merge happens between two different nodes (e.g., 2 paragraphs)
  var mergeTrafo = _getNodeMerger(args.editingBehavior, firstNode, secondNode);
  if (mergeTrafo) {
    return mergeTrafo.call(this, tx, extend({}, args, {
      containerId: args.containerId,
      first: firstNode,
      second: secondNode
    }));
  }
  return args;
};

function _getNodeMerger(behavior, node, otherNode) {
  if (behavior) {
    if (behavior.canMerge(node.type, otherNode.type)) {
      return behavior.getMerger(node.type, otherNode.type);
    }
    // Behaviors with text nodes involved
    //
    // 1. first textish, second custom
    // Example:
    //  <p>abc<p>
    //  <ul>
    //    <li>def</li>
    //    <li>ghi</li>
    //  </ul>
    //
    // could be transformed into
    //
    //  <p>abcdef<p>
    //  <ul>
    //    <li>ghi</li>
    //  </ul>
    else if (node.isInstanceOf('text') &&
      behavior.canMerge('textish', otherNode.type)) {
      return behavior.getMerger('textish', otherNode.type);
    }
    // 2. first custom, second textish
    // Example:
    //  <figure>
    //     ...
    //     <figcaption>abc</figcaption>
    //  </figure>
    //  <p>def</p>
    //
    //  could be transformed into
    //
    //  <figure>
    //     ...
    //     <figcaption>abcdef</figcaption>
    //  </figure>
    //
    else if (otherNode.isInstanceOf('text') &&
      behavior.canMerge(node.type, 'textish')) {
      return behavior.getMerger(node.type, 'textish');
    }
  }
  // Built-in behavior for textish nodes
  if (node.isInstanceOf('text') && otherNode.isInstanceOf('text')) {
    return _mergeTextNodes;
  }
  console.info("No merge behavior defined for %s <- %s", node.type, otherNode.type);
  return null;
}

var _mergeTextNodes = function(tx, args) {
  var containerId = args.containerId;
  var first = args.first;
  var second = args.second;
  var container = tx.get(containerId);
  var firstPath = first.getTextPath();
  var firstText = first.getText();
  var firstLength = firstText.length;
  var secondPath = second.getTextPath();
  var secondText = second.getText();
  var selection;
  if (firstLength === 0) {
    // hide the second node
    container.hide(firstPath[0]);
    // delete the second node
    tx.delete(firstPath[0]);
    // set the selection to the end of the first component
    selection = tx.createSelection({
      type: 'property',
      path: secondPath,
      startOffset: 0
    });
  } else {
    // append the second text
    tx.update(firstPath, { insert: { offset: firstLength, value: secondText } });
    // transfer annotations
    annotationHelpers.transferAnnotations(tx, secondPath, 0, firstPath, firstLength);
    // hide the second node
    container.hide(secondPath[0]);
    // delete the second node
    tx.delete(secondPath[0]);
    // set the selection to the end of the first component
    selection = tx.createSelection({
      type: 'property',
      path: firstPath,
      startOffset: firstLength
    });
  }
  args.selection = selection;
  return args;
};

module.exports = merge;
