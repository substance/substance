'use strict';

var each = require('lodash/each');
var documentHelpers = require('../documentHelpers');
var createAnnotation = require('./createAnnotation');

// Args:
// - selection: current document selection
// - annotationType: e.g. 'strong'
// - containerId: e.g. 'body'
function fuseAnnotation(tx, args) {
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

  each(annos, function(anno) {
    sel = sel.expand(anno.getSelection());
  });

  each(annos, function(anno) {
    tx.delete(anno.id);
  });

  // The expanded selection
  args.selection = sel;

  args.node = {type: args.annotationType};

  // Sets args.result to new annotation
  return createAnnotation(tx, args);
}

module.exports = fuseAnnotation;
