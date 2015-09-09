'use strict';

var OO = require('../basics/oo');
var Surface = require('./surface');
var EventEmitter = require('../basics/event_emitter');

var SurfaceManager = function(doc) {
  EventEmitter.call(this);
  this.doc = doc;
  this.surfaces = {};
  this.focusedSurface = null;
  this.stack = [];
  doc.connect(this, { 'document:changed': this.onDocumentChange }, {
    //lower priority so that everyting is up2date
    //when we render the selection
    priority: -1
  });
};

SurfaceManager.Prototype = function() {

  this.dispose = function() {
    this.doc.disconnect(this);
    this.surfaces = {};
  };

  this.createSurface = function(editor, options) {
    return new Surface(this, editor, options);
  };

  this.registerSurface = function(surface) {
    surface.connect(this, {
      'selection:changed': this.onSelectionChanged
    });
    this.surfaces[surface.getName()] = surface;
  };

  this.unregisterSurface = function(surface) {
    surface.disconnect(this);
    delete this.surfaces[surface.getName()];
    if (surface && this.focusedSurface === surface) {
      this.focusedSurface = null;
    }
  };

  this.hasSurfaces = function() {
    return Object.keys(this.surfaces).length > 0;
  };

  this.didFocus = function(surface) {
    if (this.focusedSurface && surface !== this.focusedSurface) {
      this.focusedSurface.setFocused(false);
    }
    this.focusedSurface = surface;
  };

  this.getFocusedSurface = function() {
    return this.focusedSurface;
  };

  this.onDocumentChange = function(change, info) {
    if (info.replay) {
      var selection = change.after.selection;
      var surfaceId = change.after.surfaceId;
      if (surfaceId) {
        var surface = this.surfaces[surfaceId];
        if (surface) {
          if (this.focusedSurface !== surface) {
            this.didFocus(surface);
          }
          surface.setSelection(selection);
        } else {
          console.warn('No surface with name', surfaceId);
        }
      }
    }
  };

  this.onSelectionChanged = function(sel, surface) {
    this.emit('selection:changed', sel, surface);
  };

  this.pushState = function() {
    var state = {
      surface: this.focusedSurface,
      selection: null
    };
    if (this.focusedSurface) {
      state.selection = this.focusedSurface.getSelection();
    }
    this.focusedSurface = null;
    this.stack.push(state);
  };

  this.popState = function() {
    var state = this.stack.pop();
    if (state && state.surface) {
      state.surface.setFocused(true);
      state.surface.setSelection(state.selection);
    }
  };

};

OO.inherit(SurfaceManager, EventEmitter);

module.exports = SurfaceManager;
