import platform from '../util/platform'

export default
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
      // DEBUG
      // if (!this.surfaces.hasOwnProperty(name)) {
      //   console.log('Unknown surface:', name, 'Registered:', Object.keys(this.surfaces).join(','))
      // }
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
    // Note: in an earlier stage we did something like this here
    // ```
    // if (surface === this.getFocusedSurface()) {
    //   this.editorSession.setSelection(null)
    // }
    // ```
    // This is apparently not the right thing to do, because
    // it will trigger a new flow, while probably still executing a flow
    // Also such a change should not be done implicitly, but explicitly.
    // E.g. when a node with selection is deleted, the selection should be nulled
    // by the model transformation
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
    } else {
      // NOTE: Tried to add an integrity check here
      // for valid sel.surfaceId
      // However this is problematic, when an editor
      // is run headless, i.e. when there are no surfaces rendered
      // On the long run we should separate these to modes
      // more explicitly. For now, any code using surfaces need
      // to be aware of the fact, that this might be not availabls
      // while in the model it is referenced.
    }
  }
}