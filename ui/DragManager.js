'use strict';

var oo = require('../util/oo');
var DefaultDOMElement = require('./DefaultDOMElement');

function DragManager() {
  var documentEl = DefaultDOMElement.wrapNativeElement(window.document);
  documentEl.on('dragenter', this.onDragenter, this);
}

DragManager.Prototype = function() {

  this.dispose = function() {
    var documentEl = DefaultDOMElement.wrapNativeElement(window.document);
    documentEl.off(this);
  };

  this.onDragenter = function(event) { // eslint-disable-line
    // we could emit an event, so that listeners could expose drop targets
    // console.log('DragManager.onDragenter');
  };

  this.onDragstart = function(event) { // eslint-disable-line
    // dito: trigger listeners to expose drop targets
    // console.log('DragManager.onDragstart');
  };

  this.onDrop = function(event) {
    event.stopPropagation();
    event.preventDefault();
    console.log('DragManager: drop request on', event.target, 'data:', this._copyDataTransfer(event.dataTransfer));
  };

  this._copyDataTransfer = function(dataTransfer) {
    return {
      types: dataTransfer.types,
      items: Array.prototype.slice.call(dataTransfer.items),
      files: Array.prototype.slice.call(dataTransfer.files)
    };
  };

};

oo.initClass(DragManager);

module.exports = DragManager;
