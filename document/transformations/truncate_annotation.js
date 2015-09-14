var helpers = require('../../document/helpers');

// Args:
// - selection: current document selection
// - annotationType: e.g. 'strong'
// - containerId: e.g. 'body'
function truncateAnnotation(tx, args) {
  var sel = args.selection;

  // HACK: container annotations indexes are not available on tx, so we pass the original document
  var annos = helpers.getAnnotationsForSelection(tx.document, sel, args.annotationType, args.containerId);
  
  // TODO: should we throw when more than one anno has been found?
  var anno = annos[0];
  var annoSel = anno.getSelection();
  var newAnnoSel = annoSel.truncate(sel);
  anno.updateRange(tx, newAnnoSel);
  args.result = anno;
  return args;
}

module.exports = truncateAnnotation;
