import inBrowser from '../../util/inBrowser'

class SurfaceManager {

  constructor(flow, documentSession) {
    this.flow = flow
    this.documentSession = documentSession
    this.surfaces = {}

    const doc = documentSession.getDocument()

    this._state = {
      focusedSurfaceId: null,
      // grouped by surfaceId and the by fragment type ('selection' | collaboratorId)
      fragments: {},
      selection: null,
      collaborators: {}
    }
    flow.subscribe({
      stage: 'model',
      resources: {
        selection: [doc.id, 'selection']
      },
      handler: this._onSelectionUpdate,
      owner: this
    })
    flow.on('post-render', this._recoverDOMSelection, this)
  }

  dispose() {
    this.flow.unsubscribe(this)
    this.flow.off(this)
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

  _onSelectionUpdate(update) {
    const selection = update.selection
    const state = this._state
    state.selection = selection
    state.focusedSurfaceId = selection.surfaceId

    // HACK: removing DOM selection *and* blurring when having a CustomSelection
    // otherwise we will receive events on the wrong surface
    // instead of bubbling up to GlobalEventManager
    if (selection && selection.isCustomSelection() && inBrowser) {
      window.getSelection().removeAllRanges()
      window.document.activeElement.blur()
    }
  }

  _recoverDOMSelection(info) {
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
    }
  }
}

export default SurfaceManager
