import { platform } from '../util'

class SurfaceManager {

  constructor(editorSession) {
    this.editorSession = editorSession
    this.surfaces = {}
    this._state = {
      selection: null
    }
    editorSession.onUpdate('selection', this._onSelectionChanged, this)
    editorSession.onPostRender(this._recoverDOMSelection, this)
  }

  dispose() {
    this.editorSession.off(this)
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
    const sel = this._state.selection
    if (sel && sel.surfaceId) {
      return this.getSurface(sel.surfaceId)
    }
  }

  getSurfaces() {
    // HACK: not yet. we would need a polyfill
    // return Object.values(this.surfaces)
    return Object.keys(this.surfaces).map(key => this.surfaces[key])
  }

  /**
   * Register a surface
   *
   * @param surface {ui/Surface} A new surface instance to register
   */
  registerSurface(surface) {
    const id = surface.getId()
    if (this.surfaces[id]) {
      console.error(`A surface with id ${id} has already been registered.`)
    }
    this.surfaces[id] = surface
  }

  /**
   * Unregister a surface
   *
   * @param surface {ui/Surface} A surface instance to unregister
   */
  unregisterSurface(surface) {
    surface.off(this)
    let surfaceId = surface.getId()
    // TODO: this is not working, has side-effects
    // with inline-nodes (see #985)
    // if (surface === this.getFocusedSurface()) {
    //   this.editorSession.setSelection(null)
    // }
    let registeredSurface = this.surfaces[surfaceId]
    if (registeredSurface === surface) {
      delete this.surfaces[surfaceId]
    }
  }

  _onSelectionChanged(selection) {
    const state = this._state
    state.selection = selection
    // HACK: removing DOM selection *and* blurring when having a CustomSelection
    // otherwise we will receive events on the wrong surface
    // instead of bubbling up to GlobalEventManager
    if (selection && selection.isCustomSelection() && platform.inBrowser) {
      window.getSelection().removeAllRanges()
      window.document.activeElement.blur()
    }
  }

  /*
    At the end of the update flow, make sure the surface is focused
    and displays the right DOM selection
  */
  _recoverDOMSelection() {
    // do not rerender the selection if the editorSession has
    // been blurred, e.g., while some component, such as Find-And-Replace
    // dialog has the focus
    if (this.editorSession._blurred) return

    let focusedSurface = this.getFocusedSurface()
    // console.log('focusedSurface', focusedSurface)
    if (focusedSurface && !focusedSurface.isDisabled()) {
      // console.log('Rendering selection on surface', focusedSurface.getId(), this.editorSession.getSelection().toString());
      focusedSurface._focus()
      focusedSurface.rerenderDOMSelection()
    }
  }
}

export default SurfaceManager
