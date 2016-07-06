'use strict';

var oo = require('../util/oo');
var DefaultDOMElement = require('./DefaultDOMElement');
var Component = require('./Component');

function DragManager(dndHandlers, context) {
  this.context = context;
  this.dndHandlers = dndHandlers;

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
    // console.log('DragManager.onDragenter', event);
  };

  this.onDragstart = function(event) { // eslint-disable-line
    // dito: trigger listeners to expose drop targets
    // console.log('DragManager.onDragstart');
  };

  this.onDrop = function(event) {
    var props = _createProps(event);
    for (var i = 0; i < this.dndHandlers.length; i++) {
      var handler = this.dndHandlers[i];
      var _break = handler.drop(props, this.context);
      if (_break) break;
    }
    event.stopPropagation();
    event.preventDefault();
  };

  function _createProps(event) {
    var props = {
      target: event.target,
    };
    var dataTransfer = event.dataTransfer;
    if (dataTransfer) {
      props.types = dataTransfer.types;
      props.items = Array.prototype.slice.call(dataTransfer.items);
      props.files = Array.prototype.slice.call(dataTransfer.files);
    }
    // try to get information about the component
    var comp = Component.getComponentFromNativeElement(event.target);
    if (comp) {
      props.comp = comp;
      if (comp._isSurface) {
        props.surface = comp;
      } else if (comp.context.surface) {
        props.surface = comp.context.surface;
      }
      if (props.surface) {
        var sel = props.surface.getSelectionFromEvent(event);
        if (sel) {
          props.selection = sel;
        }
      }
      var node = comp.props.node;
      if (node) props.node = node;
      if (comp._isTextPropertyComponent) {
        props.path = comp.props.path;
      }
    }
    return props;
  }

};

oo.initClass(DragManager);

module.exports = DragManager;
