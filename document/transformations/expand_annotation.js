'use strict';

var helpers = require('../../document/helpers');

// Args:
// - selection: current document selection
// - annotationType: e.g. 'strong'
// - containerId: e.g. 'body'
function expandAnnotation(tx, args) {
  var sel = args.selection;

  // HACK: container annotations indexes are not available on tx, so we pass the original document
  var annos = helpers.getAnnotationsForSelection(tx.document, sel, args.annotationType, args.containerId);

  var anno = annos[0];
  var annoSel = anno.getSelection();
  var newAnnoSel = annoSel.expand(sel);
  anno.updateRange(tx, newAnnoSel);
  args.result = anno;
  return args;
}

module.exports = expandAnnotation;