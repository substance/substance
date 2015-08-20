'use strict';

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
  if (direction === 'right' && component.next) {
     return _mergeComponents(tx, containerId, component, component.next);
  } else if (direction === 'left' && component.previous) {
    return _mergeComponents(tx, containerId, component.previous, component);
  } else {
    // No behavior defined for this merge
  }
};

var _mergeComponents = function(tx, containerId, firstComp, secondComp) {
  var firstNode = tx.get(firstComp.parentNode.id);
  var secondNode = tx.get(secondComp.parentNode.id);
  // TODO: it should be possible to extend the merge transformation by providing custom transformations
  // for nodes anc components
  var mergeTrafo = _getMergeTransformation(firstNode, secondNode);
  if (mergeTrafo) {
    return mergeTrafo.call(this, tx, containerId, firstComp, secondComp);
  }
};

var _getMergeTransformation = function(node, otherNode) {
  // TODO: we want to introduce a way to provide custom merge behavior
  var trafo = null;
  // if (merge[node.type] && merge[node.type][otherNode.type]) {
  //   behavior = merge[node.type][otherNode.type];
  // }
  // special convenience to define behaviors when text nodes are involved
  // E.g., you might want to define how to merge a text node into a figure
  // else
  if (node.isInstanceOf('text') && otherNode.isInstanceOf('text')) {
    trafo = _mergeTextNodes;
  }
  // else if (node.isInstanceOf('text') && merge['text']) {
  //   behavior = merge['text'][otherNode.type];
  // } else if (otherNode.isInstanceOf('text') && merge[node.type]) {
  //   behavior = merge[node.type]['text'];
  // }
  if (!trafo) {
    console.info("No merge behavior defined for %s <- %s", node.type, otherNode.type);
  }
  return trafo;
};

var _mergeTextNodes = function(tx, containerId, firstComp, secondComp) {
  var firstPath = firstComp.path;
  var firstText = tx.get(firstPath);
  var firstLength = firstText.length;
  var secondPath = secondComp.path;
  var secondText = tx.get(secondPath);
  var container = tx.get(containerId);
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
  return { selection: selection };
};

module.exports = merge;
