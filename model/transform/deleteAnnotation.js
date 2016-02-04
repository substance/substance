'use strict';

var documentHelpers = require('../documentHelpers');

// Args:
// - selection: current document selection
// - annotationType: e.g. 'strong'
// - containerId: e.g. 'body'
function deleteAnnotation(tx, args) {
  var sel = args.selection;

  if (!sel) {
    throw new Error('selection is required.');
  }

  if (sel.isContainerSelection() && !args.containerId) {
    throw new Error('containerId must be provided for container selections');
  }

  var annos = documentHelpers.getAnnotationsForSelection(tx, sel, args.annotationType, args.containerId);
  var annoId = annos[0].id;
  tx.delete(annoId);

  // Provides caller with id of deleted annotation
  args.result = annoId;
  return args;
}

module.exports = deleteAnnotation;