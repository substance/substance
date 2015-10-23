/* jshint latedef: false */
"use strict";

var Annotations = require('../annotation_updates');
var Coordinate = require('../coordinate');

function updateAnnotations(tx, args) {
  var op = args.op;
  if (op.isUpdate()) {
    var diff = op.diff;
    if (diff.isInsert()) {
      return _upateAfterInsert(tx, args);
    } else if (diff.isDelete()) {
      return _updateAfterDelete(tx, args);
    }
  } else {
    throw new Error('Only text updates are supported.');
  }
  return args;
}

function _upateAfterInsert(tx, args) {
  var op = args.op;
  var diff = op.diff;
  Annotations.insertedText(tx, new Coordinate(op.getPath(), diff.pos), diff.getLength(), args.ignoredAnnotations);
  return args;
}

function _updateAfterDelete(tx, args) {
  var op = args.op;
  var diff = op.diff;
  var result = Annotations.deletedText(tx, op.getPath(), diff.pos, diff.pos + diff.getLength(), args.replaceTextSupport);
  if (args.replaceTextSupport) {
    args.ignoredAnnotations = result;
  }
  return args;
}

module.exports = updateAnnotations;
