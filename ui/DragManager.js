'use strict';

import oo from '../util/oo'
import DefaultDOMElement from './DefaultDOMElement'
import Component from './Component'

function DragManager(dndHandlers, context) {
  this.context = context;
  this.dndHandlers = dndHandlers;

  this._source = null;
}

DragManager.Prototype = function() {

  this.dispose = function() {
    var documentEl = DefaultDOMElement.wrapNativeElement(window.document);
    documentEl.off(this);
  };

  this.onDragStart = function(event, component) { // eslint-disable-line
    // dito: trigger listeners to expose drop targets
    // console.log('DragManager.onDragStart');
    event.dataTransfer.effectAllowed = 'all';
    event.dataTransfer.setData('text/html', event.target.outerHTML);
    event.stopPropagation();

    this._source = {
      component: component
    };

    for (var i = 0; i < this.dndHandlers.length; i++) {
      var handler = this.dndHandlers[i];
      handler.dragStart(this._source, this.context);
    }
  };

  this.onDragEnter = function(event, component) { // eslint-disable-line
    // we could emit an event, so that listeners could expose drop targets
    // console.log('DragManager.onDragEnter', event);
    event.stopPropagation();
  };

  this.onDragOver = function(event, component) { // eslint-disable-line
    // prevent default to allow drop
    event.preventDefault();
    event.stopPropagation();
  };

  this.onDrop = function(event, component) {
    event.preventDefault();
    event.stopPropagation();
    // console.log('DragManager.onDragEnter', event);
    var params = {
      source: this._source,
      target: _getTargetInfo(event, component),
      data: _getData(event)
    };
    var i, handler;
    for (i = 0; i < this.dndHandlers.length; i++) {
      handler = this.dndHandlers[i];
      var _break = handler.drop(params, this.context);
      if (_break) break;
    }
    for (i = 0; i < this.dndHandlers.length; i++) {
      handler = this.dndHandlers[i];
      handler.dragEnd(params, this.context);
    }
  };

  function _getData(event) {
    var dataTransfer = event.dataTransfer;
    if (dataTransfer) {
      return {
        types: dataTransfer.types,
        items: Array.prototype.slice.call(dataTransfer.items),
        files: Array.prototype.slice.call(dataTransfer.files)
      };
    }
  }

  function _getTargetInfo(event) {
    var target = {
      element: DefaultDOMElement.wrapNativeElement(event.target)
    };
    // try to get information about the component
    var comp = Component.getComponentFromNativeElement(event.target);
    comp = _getComponent(comp);
    if (comp) {
      target.comp = comp;
      if (target._isSurface) {
        target.surface = comp;
      } else if (comp.context.surface) {
        target.surface = comp.context.surface;
      }
      if (target.surface) {
        var sel = target.surface.getSelectionFromEvent(event);
        if (sel) target.selection = sel;
      }
      var node = comp.props.node;
      if (node) target.node = node;
      if (comp._isTextPropertyComponent) {
        target.path = comp.props.path;
      }
    }
    return target;
  }

  function _getComponent(comp) {
    if (comp._isTextNodeComponent || comp._isElementComponent) {
      return _getComponent(comp.getParent());
    }
    return comp;
  }

};

oo.initClass(DragManager);

export default DragManager;
