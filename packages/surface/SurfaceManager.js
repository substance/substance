import inBrowser from '../../util/inBrowser'

class SurfaceManager {

  constructor(editSession) {
    this.editSession = editSession
    this.surfaces = {}
    this._state = {
      focusedSurfaceId: null,
      selection: null,
    }
    editSession.on('model', this._onSelectionChanged, this)
    editSession.on('post-render', this._recoverDOMSelection, this)
  }

  dispose() {
    this.editSession.off(this)
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

  _onSelectionChanged(session) {
    // TODO: would be nice if we had a more convenient events
    if (!session.hasChanged('selection')) return
    const selection = session.getSelection()
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

  _recoverDOMSelection() {
    // at the end of the update flow, make sure the surface is focused
    // and displays the right DOM selection.
    let focusedSurface = this.getFocusedSurface()
    if (focusedSurface && !focusedSurface.isDisabled()) {
      // console.log('Rendering selection on surface', focusedSurface.getId(), this.editSession.getSelection().toString());
      focusedSurface.focus()
      focusedSurface.rerenderDOMSelection()
    }
  }
}

export default SurfaceManager
