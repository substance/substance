'use strict';

var helpers = require('../../document/helpers');

// Args:
// - selection: current document selection
// - annotationType: e.g. 'strong'
// - containerId: e.g. 'body'
function expandAnnotation(tx, args) {
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

  var annos = helpers.getAnnotationsForSelection(tx, sel, args.annotationType, args.containerId);
  var anno = annos[0];
  var annoSel = anno.getSelection();
  var newAnnoSel = annoSel.expand(sel);
  anno.updateRange(tx, newAnnoSel);
  args.result = anno;
  return args;
}

module.exports = expandAnnotation;