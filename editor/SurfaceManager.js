import { platform, isArrayEqual, getKeyForPath } from '../util'

const DEBUG = false

export default class SurfaceManager {
  constructor (editorState) {
    this.editorState = editorState
    this.surfaces = new Map()

    editorState.addObserver(['selection', 'document'], this._onSelectionOrDocumentChange, this, { stage: 'pre-position' })
    editorState.addObserver(['selection', 'document'], this._scrollSelectionIntoView, this, { stage: 'finalize' })
  }

  dispose () {
    this.editorState.off(this)
  }

  getSurface (name) {
    if (name) {
      return this.surfaces.get(name)
    }
  }

  getFocusedSurface () {
    console.error("DEPRECATED: use 'context.editorState.focusedSurface instead")
    return this.editorState.focusedSurface
  }

  registerSurface (surface) {
    const id = surface.getId()
    if (DEBUG) console.log(`Registering surface ${id}.`, surface.__id__)
    if (this.surfaces.has(id)) {
      throw new Error(`A surface with id ${id} has already been registered.`)
    }
    this.surfaces.set(id, surface)
  }

  unregisterSurface (surface) {
    const id = surface.getId()
    if (DEBUG) console.log(`Unregistering surface ${id}.`, surface.__id__)
    const registeredSurface = this.surfaces.get(id)
    if (registeredSurface === surface) {
      this.surfaces.delete(id)
    }
  }

  // TODO: would be good to have an index of surfaces by path
  _getSurfaceForProperty (path) {
    // first try the canonical one
    const canonicalId = getKeyForPath(path)
    if (this.surfaces.has(canonicalId)) {
      return this.surfaces.get(canonicalId)
    }
    for (const surface of this.surfaces.values()) {
      let surfacePath = null
      if (surface._isContainerEditor) {
        surfacePath = surface.getContainerPath()
      } else if (surface.getPath) {
        surfacePath = surface.getPath()
      }
      if (surfacePath && isArrayEqual(path, surfacePath)) {
        return surface
      }
    }
  }

  _onSelectionOrDocumentChange () {
    // console.log('SurfaceManager._onSelectionChange()')

    // Reducing state.focusedSurface (only if selection has changed)
    if (this.editorState.isDirty('selection')) {
      const selection = this.editorState.selection
      if (!selection || selection.isNull()) {
        // blur the focused surface to make sure that it does not remain focused
        // e.g. if DOM selection is not set for some reasons.
        // HACK: not all surfaces implement _blur()
        const focusedSurface = this.editorState.focusedSurface
        if (focusedSurface && focusedSurface._blur) {
          focusedSurface._blur()
        }
      }
      // update state.focusedSurface
      this._reduceFocusedSurface(selection)
      // HACK: removing DOM selection *and* blurring when having a CustomSelection
      // otherwise we will receive events on the wrong surface
      // instead of bubbling up to GlobalEventManager
      if (selection && selection.isCustomSelection() && platform.inBrowser) {
        window.getSelection().removeAllRanges()
        window.document.activeElement.blur()
      }
    }

    // TODO: this still needs to be improved. The DOM selection can be affected by other updates than document changes
    this._recoverDOMSelection()
  }

  _reduceFocusedSurface (sel) {
    const editorState = this.editorState
    let surface = null
    if (sel && sel.surfaceId) {
      surface = this.surfaces.get(sel.surfaceId)
    }
    editorState.focusedSurface = surface
  }

  /*
    At the end of the update flow, make sure the surface is focused
    and displays the right DOM selection
  */
  _recoverDOMSelection () {
    // console.log('SurfaceManager._recoverDOMSelection()')
    const editorState = this.editorState
    // do not rerender the selection if the editorSession has
    // been blurred, e.g., while some component, such as Find-And-Replace
    // dialog has the focus
    if (editorState.isBlurred) return
    const focusedSurface = editorState.focusedSurface
    // console.log('focusedSurface', focusedSurface)
    if (focusedSurface && !focusedSurface.isDisabled()) {
      // console.log('Rendering selection on surface', focusedSurface.getId(), this.editorState.selection.toString())
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

  _scrollSelectionIntoView () {
    const editorState = this.editorState
    const focusedSurface = editorState.focusedSurface
    if (focusedSurface && !focusedSurface.isDisabled()) {
      focusedSurface.send('scrollSelectionIntoView', editorState.selection)
    }
  }
}
