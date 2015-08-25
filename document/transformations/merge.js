'use strict';

var _ = require('../../basics/helpers');
var Annotations = require('../annotation_updates');

/* jshint latedef: false */

// low-level merge implementation
var merge = function(tx, args) {
  var containerId = args.containerId;
  var path = args.path;
  var direction = args.direction;
  if (!containerId||!path||!direction) {
    throw new Error('Insufficient arguments! mandatory fields: `containerId`, `path`, `direction`');
  }
  var container = tx.get(containerId);
  var component = container.getComponent(path);
  var tmp;
  if (direction === 'right' && component.next) {
    tmp = _mergeComponents(tx, _.extend({}, args, {
      containerId: containerId,
      first: component,
      second: component.next
    }));
    args.selection = tmp.selection;
  } else if (direction === 'left' && component.previous) {
    tmp = _mergeComponents(tx, _.extend({}, args, {
      containerId: containerId,
      first: component.previous,
      second: component
    }));
    args.selection = tmp.selection;
  } else {
    // No behavior defined for this merge
  }
  return args;
};

var _mergeComponents = function(tx, args) {
  var firstComp = args.first;
  var secondComp = args.second;
  var firstNode = tx.get(firstComp.parentNode.id);
  var secondNode = tx.get(secondComp.parentNode.id);
  var behavior = args.editingBehavior;
  var mergeTrafo;
  // some components consist of multiple child components
  // in this case, a custom editing behavior must have been defined
  if (firstNode === secondNode) {
    if (behavior && behavior.canMergeComponents(firstNode.type)) {
      mergeTrafo = behavior.getComponentMerger(firstNode.type);
      return mergeTrafo.call(this, tx, _.extend({}, args, {
        node: firstNode,
        first: firstComp,
        second: secondComp
      }));
    }
  } else {
    // most often a merge happens between two different nodes (e.g., 2 paragraphs)
    mergeTrafo = _getNodeMerger(args.editingBehavior, firstNode, secondNode);
    if (mergeTrafo) {
      return mergeTrafo.call(this, tx, _.extend({}, args, {
        containerId: args.containerId,
        first: firstNode,
        second: secondNode
      }));
    }
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
    Annotations.transferAnnotations(tx, secondPath, 0, firstPath, firstLength);
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
