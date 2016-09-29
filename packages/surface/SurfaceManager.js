import forEach from 'lodash/forEach'
import clone from 'lodash/clone'
import inBrowser from '../../util/inBrowser'

class SurfaceManager {
  constructor(documentSession) {
    this.documentSession = documentSession

    this.surfaces = {}

    this._state = {
      focusedSurfaceId: null,
      // grouped by surfaceId and the by fragment type ('selection' | collaboratorId)
      fragments: {},
      selection: null,
      collaborators: {}
    }

    this.documentSession.on('update', this.onSessionUpdate, this)
    // HACK: trying to make rerendering the DOM selection the very last
    // TODO: we want to introduce a FlowManager, which will hopefully
    // make this prio hack obsolete
    this.documentSession.on('didUpdate', this.onSessionDidUpdate, this, {
      priority: -1000000
    })
  }

  dispose() {
    this.documentSession.off(this)
  }

  /**
   * Get Surface instance
   *
   * @param {String} name Name under which the surface is registered
   * @return {ui/Surface} The surface instance
   */
  getSurface(name) {
    if (name) {
      return this.surfaces[name]
    }
  }

  /**
   * Get the currently focused Surface.
   *
   * @return {ui/Surface} Surface instance
   */
  getFocusedSurface() {
    if (this._state.focusedSurfaceId) {
      return this.getSurface(this._state.focusedSurfaceId)
    }
  }

  /**
   * Register a surface
   *
   * @param surface {ui/Surface} A new surface instance to register
   */
  registerSurface(surface) {
    this.surfaces[surface.getId()] = surface
  }

  /**
   * Unregister a surface
   *
   * @param surface {ui/Surface} A surface instance to unregister
   */
  unregisterSurface(surface) {
    surface.off(this)
    let surfaceId = surface.getId()
    let registeredSurface = this.surfaces[surfaceId]
    if (registeredSurface === surface) {
      let focusedSurface = this.getFocusedSurface()
      delete this.surfaces[surfaceId]
      if (surface && focusedSurface === surface) {
        this._state.focusedSurfaceId = null
      }
    }
  }

  // keeps track of selection fragments and collaborator fragments
  onSessionUpdate(update) {
    let _state = this._state

    let updatedSurfaces = {}
    if (update.selection) {
      let focusedSurface = this.surfaces[update.selection.surfaceId]
      _state.focusedSurfaceId = update.selection.surfaceId
      if (focusedSurface && !focusedSurface.isDisabled()) {
        focusedSurface._focus()
      } else if (update.selection.isCustomSelection() && inBrowser) {
        // HACK: removing DOM selection *and* blurring when having a CustomSelection
        // otherwise we will receive events on the wrong surface
        // instead of bubbling up to GlobalEventManager
        window.getSelection().removeAllRanges()
        window.document.activeElement.blur()
      }
    }

    if (update.change) {
      forEach(this.surfaces, function(surface, surfaceId) {
        if (surface._checkForUpdates(update.change)) {
          updatedSurfaces[surfaceId] = true
        }
      })
    }

    let fragments = _state.fragments || {}

    // get fragments for surface with id or create a new hash
    function _fragmentsForSurface(surfaceId) {
      // surfaceFrags is a hash, where fragments are stored grouped by owner
      let surfaceFrags = fragments[surfaceId]
      if (!surfaceFrags) {
        surfaceFrags = {}
        fragments[surfaceId] = surfaceFrags
      }
      return surfaceFrags
    }

    // gets selection fragments with collaborator attached to each fragment
    // as used by TextPropertyComponent
    function _getFragmentsForSelection(sel, collaborator) {
      let frags = sel.getFragments()
      if (collaborator) {
        frags = frags.map(function(frag) {
          frag.collaborator = collaborator
          return frag
        });
      }
      return frags
    }

    function _updateSelectionFragments(oldSel, newSel, collaborator) {
      // console.log('SurfaceManager: updating selection fragments', oldSel, newSel, collaborator);
      let oldSurfaceId = oldSel ? oldSel.surfaceId : null
      let newSurfaceId = newSel ? newSel.surfaceId : null
      let owner = 'local-user'
      if (collaborator) {
        owner = collaborator.collaboratorId
      }
      // clear old fragments
      if (oldSurfaceId && oldSurfaceId !== newSurfaceId) {
        _fragmentsForSurface(oldSurfaceId)[owner] = []
        updatedSurfaces[oldSurfaceId] = true
      }
      if (newSurfaceId) {
        _fragmentsForSurface(newSurfaceId)[owner] = _getFragmentsForSelection(newSel, collaborator)
        updatedSurfaces[newSurfaceId] = true
      }
    }

    if (update.selection) {
      _updateSelectionFragments(_state.selection, update.selection)
      _state.selection = update.selection
    }

    if (update.collaborators) {
      forEach(update.collaborators, function(collaborator, collaboratorId) {
        let oldCollaborator = _state.collaborators[collaboratorId]
        let oldSel, newSel
        if (oldCollaborator) {
          oldSel = oldCollaborator.selection
        }
        if (collaborator) {
          newSel = collaborator.selection
        }
        if (!oldSel || !oldSel.equals(newSel)) {
          _updateSelectionFragments(oldSel, newSel, collaborator)
        }
        _state.collaborators[collaboratorId] = {
          collaboratorId: collaboratorId,
          selection: newSel
        }
      })
    }

    updatedSurfaces = Object.keys(updatedSurfaces)
    // console.log('SurfaceManager: updating surfaces', updatedSurfaces);

    updatedSurfaces.forEach(function(surfaceId) {
      var surface = this.surfaces[surfaceId]
      if (surface) {
        var newFragments = fragments[surfaceId]
        // console.log('SurfaceManager: providing surface %s with new fragments', surfaceId, newFragments);
        surface.extendProps({
          fragments: clone(newFragments)
        })
      }
    }.bind(this))
  }

  onSessionDidUpdate(update, info) {
    if (info.skipSelection) {
      // console.log('Skipping selection update.');
      return
    }
    // at the end of the update flow, make sure the surface is focused
    // and displays the right DOM selection.
    let focusedSurface = this.getFocusedSurface()
    if (focusedSurface && !focusedSurface.isDisabled()) {
      // console.log('Rendering selection on surface', focusedSurface.getId(), this.documentSession.getSelection().toString());
      focusedSurface.focus()
      focusedSurface.rerenderDOMSelection()
      focusedSurface._sendOverlayHints()
    }
  }
}

export default SurfaceManager
