'use strict';

var oo = require('../util/oo');

function DragAndDropHandler() {}

DragAndDropHandler.Prototype = function() {

  this._isDragAndDropHandler = true;

  this.dragStart = function(event, context) { // eslint-disable-line
    // nothing
  };

  this.drop = function(event, context) { // eslint-disable-line
    // nothing
  };

};

oo.initClass(DragAndDropHandler);

module.exports = DragAndDropHandler;
