'use strict';

var oo = require('../util/oo');

function DragAndDropHandler() {}

DragAndDropHandler.Prototype = function() {

  this._isDragAndDropHandler = true;

  this.dragStart = function(params, context) { // eslint-disable-line
    // nothing
  };

  this.drop = function(params, context) { // eslint-disable-line
    // nothing
  };

  this.dragEnd = function(params, context) { // eslint-disable-line
    // nothing
  };

};

oo.initClass(DragAndDropHandler);

module.exports = DragAndDropHandler;
