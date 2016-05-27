'use strict';

var forEach = require('lodash/forEach');
var clone = require('lodash/clone');
var oo = require('../util/oo');
var warn = require('../util/warn');

function SurfaceManager(documentSession) {
  this.documentSession = documentSession;

  this.surfaces = {};

  this._state = {
    focusedSurface: null,
    // grouped by surfaceId and the by fragment type ('selection' | collaboratorId)
    fragments: {},
    selection: null,
    collaborators: {},
  };

  this.documentSession.on('update', this.onSessionUpdate, this);
  this.documentSession.on('didUpdate', this.onSessionDidUpdate, this);
}

SurfaceManager.Prototype = function() {

  this.dispose = function() {
    this.documentSession.off(this);
  };

  /**
   * Get Surface instance
   *
   * @param {String} name Name under which the surface is registered
   * @return {ui/Surface} The surface instance
   */
  this.getSurface = function(name) {
    if (name) {
      return this.surfaces[name];
    } else {
      warn('Deprecated: Use getFocusedSurface. Always provide a name for getSurface otherwise.');
      return this.getFocusedSurface();
    }
  };

  /**
   * Get the currently focused Surface.
   *
   * @return {ui/Surface} Surface instance
   */
  this.getFocusedSurface = function() {
    return this._state.focusedSurface;
  };

  /**
   * Register a surface
   *
   * @param surface {ui/Surface} A new surface instance to register
   */
  this.registerSurface = function(surface) {
    this.surfaces[surface.getId()] = surface;
  };

  /**
   * Unregister a surface
   *
   * @param surface {ui/Surface} A surface instance to unregister
   */
  this.unregisterSurface = function(surface) {
    surface.off(this);
    var surfaceId = surface.getId();
    var registeredSurface = this.surfaces[surfaceId];
    if (registeredSurface === surface) {
      delete this.surfaces[surfaceId];
      if (surface && this.focusedSurface === surface) {
        this._state.focusedSurface = null;
      }
    }
  };

  // keeps track of selection fragments and collaborator fragments
  this.onSessionUpdate = function(update) {
    var _state = this._state;

    var updatedSurfaces = {};
    if (update.selection) {
      var focusedSurface = this.surfaces[update.selection.surfaceId];
      _state.focusedSurface = focusedSurface;
      if (focusedSurface) {
        focusedSurface._focus();
      }
    }

    if (update.change) {
      forEach(this.surfaces, function(surface, surfaceId) {
        if (surface._checkForUpdates(update.change)) {
          updatedSurfaces[surfaceId] = true;
        }
      });
    }

    var fragments = _state.fragments || {};

    // get fragments for surface with id or create a new hash
    function _fragmentsForSurface(surfaceId) {
      // surfaceFrags is a hash, where fragments are stored grouped by owner
      var surfaceFrags = fragments[surfaceId];
      if (!surfaceFrags) {
        surfaceFrags = {};
        fragments[surfaceId] = surfaceFrags;
      }
      return surfaceFrags;
    }

    // gets selection fragments with collaborator attached to each fragment
    // as used by TextPropertyComponent
    function _getFragmentsForSelection(sel, collaborator) {
      var frags = sel.getFragments();
      if (collaborator) {
        frags = frags.map(function(frag) {
          frag.collaborator = collaborator;
          return frag;
        });
      }
      return frags;
    }

    function _updateSelectionFragments(oldSel, newSel, collaborator) {
      // console.log('SurfaceManager: updating selection fragments', oldSel, newSel, collaborator);
      var oldSurfaceId = oldSel ? oldSel.surfaceId : null;
      var newSurfaceId = newSel ? newSel.surfaceId : null;
      var owner = 'local-user';
      if (collaborator) {
        owner = collaborator.collaboratorId;
      }
      // clear old fragments
      if (oldSurfaceId && oldSurfaceId !== newSurfaceId) {
        _fragmentsForSurface(oldSurfaceId)[owner] = [];
        updatedSurfaces[oldSurfaceId] = true;
      }
      if (newSurfaceId) {
        _fragmentsForSurface(newSurfaceId)[owner] = _getFragmentsForSelection(newSel, collaborator);
        updatedSurfaces[newSurfaceId] = true;
      }
    }

    if (update.selection) {
      _updateSelectionFragments(_state.selection, update.selection);
      _state.selection = update.selection;
    }

    if (update.collaborators) {
      forEach(update.collaborators, function(collaborator, collaboratorId) {
        var oldCollaborator = _state.collaborators[collaboratorId];
        var oldSel, newSel;
        if (oldCollaborator){
          oldSel = oldCollaborator.selection;
        }
        if (collaborator){
          newSel = collaborator.selection;
        }
        if (!oldSel || !oldSel.equals(newSel)) {
          _updateSelectionFragments(oldSel, newSel, collaborator);
        }
        _state.collaborators[collaboratorId] = {
          collaboratorId: collaboratorId,
          selection: newSel
        };
      });
    }

    updatedSurfaces = Object.keys(updatedSurfaces);
    // console.log('SurfaceManager: updating surfaces', updatedSurfaces);

    updatedSurfaces.forEach(function(surfaceId) {
      var surface = this.surfaces[surfaceId];
      if (surface) {
        var newFragments = fragments[surfaceId];
        // console.log('SurfaceManager: providing surface %s with new fragments', surfaceId, newFragments);
        surface.extendProps({
          fragments: clone(newFragments)
        });
      }
    }.bind(this));
  };

  this.onSessionDidUpdate = function() {
    var focusedSurface = this._state.focusedSurface;
    if (focusedSurface) {
      // Note: making sure that at the surface is focused and the selection is rendered
      // console.log('SurfaceManager: calling surface.focus() after session update.', focusedSurface.getId());
      focusedSurface.focus();
    }
  };

};

oo.initClass(SurfaceManager);

module.exports = SurfaceManager;
