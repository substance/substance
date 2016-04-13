'use strict';

var documentHelpers = require('../documentHelpers');

/*
 Args:
 - selection: current document selection
 - annotationType: e.g. 'strong'
 - containerId: e.g. 'body'

 TODO: this transformation has a weird signature, not taking the annotation
 which should be expanded explicitly, but looking it up again via the given
 selection
*/
function expandAnnotation(tx, args) {
  var sel = args.selection;
  var annotationType = args.annotationType;
  var containerId = args.containerId;

  if (!sel) {
    throw new Error('selection is required.');
  }

  if (!annotationType) {
    throw new Error('annotationType is required');
  }

  // TODO: it seems unecessary to have a container selection
  // and additionally requiring a container id
  if (sel.isContainerSelection() && !containerId) {
    throw new Error('containerId must be provided for container selections');
  }

  var annos = documentHelpers.getAnnotationsForSelection(tx, sel, annotationType, containerId);
  if (annos.length !== 1) {
    throw new Error('Illegal state: expecting to find one annotation of type ' + annotationType);
  }
  var anno = annos[0];
  var annoSel = anno.getSelection();
  var newAnnoSel = annoSel.expand(sel);
  anno.updateRange(tx, newAnnoSel);
  args.result = anno;
  return args;
}

module.exports = expandAnnotation;
