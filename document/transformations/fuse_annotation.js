'use strict';

var _ = require('../../basics/helpers');
var helpers = require('../../document/helpers');
var createAnnotation = require('./create_annotation');

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

  var annos = helpers.getAnnotationsForSelection(tx, sel, args.annotationType, args.containerId);

  _.each(annos, function(anno) {
    sel = sel.expand(anno.getSelection());
  });

  _.each(annos, function(anno) {
    tx.delete(anno.id);
  });
  
  // The expanded selection
  args.selection = sel;
  
  // Sets args.result to new annotation
  return createAnnotation(tx, args);
}

module.exports = fuseAnnotation;
