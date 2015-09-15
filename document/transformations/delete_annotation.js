'use strict';

var helpers = require('../../document/helpers');

// Args:
// - selection: current document selection
// - annotationType: e.g. 'strong'
// - containerId: e.g. 'body'
function deleteAnnotation(tx, args) {
  var sel = args.selection;

  // HACK: container annotations indexes are not available on tx, so we pass the original document
  var annos = helpers.getAnnotationsForSelection(tx.document, sel, args.annotationType, args.containerId);
  var annoId = annos[0].id;
  tx.delete(annoId);

  // Provides caller with id of deleted annotation
  args.result = annoId;
  return args;
}

module.exports = deleteAnnotation;