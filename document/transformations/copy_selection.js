'use strict';

var _ = require('../../basics/helpers');
var Annotations = require('../annotation_updates');

/* jshint latedef: false */

// create a document instance containing only the selected content
var copySelection = function(doc, args) {
  var selection = args.selection;
  if (selection.isNull()) {
    args.doc = null;
  }
  // return a simplified version if only a piece of text is selected
  else if (selection.isPropertySelection() || _.isEqual(selection.start.path, selection.end.path)) {
    args.doc = _copyPropertySelection(doc, selection);
  }
  else if (selection.isContainerSelection()) {
    args.doc = _copyContainerSelection(doc, selection);
  } else {
    console.error('Copy is not yet supported for selection type.');
    args.doc = null;
  }
  return args;
};

var _copyPropertySelection = function(doc, selection) {
  var copy = doc.newInstance();
  copy._setForClipboard(true);
  var path = selection.start.path;
  var offset = selection.start.offset;
  var endOffset = selection.end.offset;
  var text = doc.get(path);
  var containerNode = copy.get(copySelection.CLIPBOARD_CONTAINER_ID);
  if (!containerNode) {
    containerNode = copy.create({
      type: 'container',
      id: copySelection.CLIPBOARD_CONTAINER_ID,
      nodes: []
    });
  }
  copy.create({
    type: doc.schema.getDefaultTextType(),
    id: 'text',
    content: text.substring(offset, endOffset)
  });
  containerNode.show('text');
  var annotations = doc.getIndex('annotations').get(path, offset, endOffset);
  _.each(annotations, function(anno) {
    var data = _.deepclone(anno.toJSON());
    data.path = ['text', 'content'];
    data.startOffset = Math.max(offset, anno.startOffset)-offset;
    data.endOffset = Math.min(endOffset, anno.endOffset)-offset;
    copy.create(data);
  });
  return copy;
};

var _copyContainerSelection = function(doc, selection) {
  var copy = doc.newInstance();
  copy._setForClipboard(true);
  var annotationIndex = doc.getIndex('annotations');
  var container = doc.get(selection.containerId);
  var startComp = container.getComponent(selection.start.path);
  var endComp = container.getComponent(selection.end.path);
  var containerNode = copy.create({
    type: 'container',
    id: copySelection.CLIPBOARD_CONTAINER_ID,
    nodes: []
  });
  // 1. Copy nodes and annotations.
  var i, comp;
  var created = {};
  for (i = startComp.getIndex(); i <= endComp.getIndex(); i++) {
    comp = container.getComponentAt(i);
    var nodeId = comp.parentNode.id;
    var node = doc.get(nodeId);
    if (!created[nodeId]) {
      created[nodeId] = copy.create(node.toJSON());
      containerNode.show(nodeId);
    }
    var annotations = annotationIndex.get(comp.path);
    for (var j = 0; j < annotations.length; j++) {
      copy.create(_.deepclone(annotations[j].toJSON()));
    }
  }
  // 2. Truncate properties according to the selection.
  // TODO: we need a more sophisticated concept when we introduce dynamic structures
  // such as lists or tables
  var startNodeComponent = startComp.parentNode;
  var text;
  for (i = 0; i < startNodeComponent.components.length; i++) {
    comp = startNodeComponent.components[i];
    if (comp === startComp) {
      if (selection.start.offset > 0) {
        text = doc.get(comp.path);
        copy.update(comp.path, {
          delete: { start: 0, end: selection.start.offset }
        });
        Annotations.deletedText(copy, comp.path, 0, selection.start.offset);
      }
      break;
    } else {
      copy.set(comp.path, "");
    }
  }
  var endNodeComponent = endComp.parentNode;
  for (i = 0; i < endNodeComponent.components.length; i++) {
    comp = endNodeComponent.components[i];
    if (comp === endComp) {
      text = doc.get(comp.path);
      if (selection.end.offset < text.length) {
        copy.update(comp.path, {
          delete: { start: selection.end.offset, end: text.length }
        });
        Annotations.deletedText(copy, comp.path, selection.end.offset, text.length);
      }
      break;
    } else {
      copy.set(comp.path, "");
    }
  }
  return copy;
};

copySelection.CLIPBOARD_CONTAINER_ID = "clipboard_content";

module.exports = copySelection;
