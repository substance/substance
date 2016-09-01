'use strict';

/*
  Experimental

  We are seeking for a solution providing access to global DOM events
  while considering the current app state ~ document session state.

  This implementation is just a prototype and might change with the next releases.
*/

import oo from '../util/oo'
import inBrowser from '../util/inBrowser'
import DefaultDOMElement from './DefaultDOMElement'
import DOMElement from './DOMElement'

/*
  TODO: to be 100% safe we would need to introduce a hidden contenteditable
  where we put the selection in case of non-surface situations
  so that we are still able to receive events such as 'copy' -- actually only Edge is not dispatching
  to window.document.
*/

function GlobalEventHandler(documentSession, surfaceManager) {
  this.documentSession = documentSession;
  this.surfaceManager = surfaceManager;
  this.listeners = [];
  this.initialize();
}

GlobalEventHandler.Prototype = function() {

  var events = [ 'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup' , 'copy'];

  this.initialize = function() {
    if (inBrowser) {
      var document = DefaultDOMElement.wrapNativeElement(window.document);
      events.forEach(function(name) {
        document.on(name, this._dispatch.bind(this, name), this);
      }.bind(this));
    }
  };

  this.dispose = function() {
    if (inBrowser) {
      var document = DefaultDOMElement.wrapNativeElement(window.document);
      document.off(this);
    }
  };

  this.on = DOMElement.prototype.on;

  this.off = DOMElement.prototype.off;

  this.addEventListener = function(eventName, handler, options) {
    if (!options.id) {
      throw new Error("GlobalEventHandler can only be used with option 'id'");
    }
    var listener = new DOMElement.EventListener(eventName, handler, options);
    this.listeners.push(listener);
  };

  this.removeEventListener = function(listener) {
    var idx = this.listeners.indexOf(listener);
    if (idx > -1) {
      this.listeners.splice(idx, 1);
    }
  };

  this.getEventListeners = function() {
    return this.listeners;
  };

  this._getActiveListener = function(eventName) {
    var documentSession = this.documentSession;
    var sel = documentSession.getSelection();
    if (sel) {
      var surfaceId = sel.surfaceId;
      for (var i = 0; i < this.listeners.length; i++) {
        var listener = this.listeners[i];
        if (listener.eventName === eventName && listener.options.id === surfaceId) {
          return listener;
        }
      }
    }
  };

  this._dispatch = function(eventName, e) {
    var listener = this._getActiveListener(eventName);
    if (listener) {
      listener.handler(e);
    }
  };
};

oo.initClass(GlobalEventHandler);

export default GlobalEventHandler;
