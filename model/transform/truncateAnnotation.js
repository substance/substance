'use strict';

var documentHelpers = require('../documentHelpers');

// Args:
// - selection: current document selection
// - annotationType: e.g. 'strong'
// - containerId: e.g. 'body'
function truncateAnnotation(tx, args) {
  var sel = args.selection;

  if (!sel) {
    throw new Error('selection is required.');
  }

  if (!args.annotationType) {
    throw new Error('annotationType is required');
  }

  if (sel.isContainerSelection() && !args.containerId) {
    throw new Error('containerId must be provided for container selections');
  }

  var annos = documentHelpers.getAnnotationsForSelection(tx, sel, args.annotationType, args.containerId);
  // TODO: should we throw when more than one anno has been found?
  var anno = annos[0];
  var annoSel = anno.getSelection();
  var newAnnoSel = annoSel.truncateWith(sel);
  anno.updateRange(tx, newAnnoSel);
  args.result = anno;
  return args;
}

module.exports = truncateAnnotation;
