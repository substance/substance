import isUndefined from 'lodash/isUndefined'
import startsWith from 'lodash/startsWith'
import createSurfaceId from '../../util/createSurfaceId'
import keys from '../../util/keys'
import platform from '../../util/platform'
import inBrowser from '../../util/inBrowser'
import copySelection from '../../model/transform/copySelection'
import deleteSelection from '../../model/transform/deleteSelection'
import deleteCharacter from '../../model/transform/deleteCharacter'
import insertText from '../../model/transform/insertText'
import Clipboard from '../../ui/Clipboard'
import Component from '../../ui/Component'
import DefaultDOMElement from '../../ui/DefaultDOMElement'
import DOMSelection from '../../ui/DOMSelection'
import UnsupportedNode from '../../ui/UnsupportedNodeComponent'

/**
   Abstract interface for editing components.
   Dances with contenteditable, so you don't have to.
*/
class Surface extends Component {

  constructor(...args) {
    super(...args)

    // EditorSession instance must be provided either as a prop
    // or via dependency-injection
    this.editorSession = this.props.editorSession || this.context.editorSession
    if (!this.editorSession) {
      throw new Error('No EditorSession provided')
    }
    this.name = this.props.name
    if (!this.name) {
      throw new Error('Surface must have a name.')
    }
    if (this.name.indexOf('/') > -1) {
      // because we are using '/' to deal with nested surfaces (isolated nodes)
      throw new Error("Surface.name must not contain '/'")
    }
    // this path is an identifier unique for this surface
    // considering nesting in IsolatedNodes
    this._surfaceId = createSurfaceId(this)

    this.clipboard = new Clipboard(this, {
      converterRegistry: this.context.converterRegistry
    })

    this.domSelection = null
    this.domObserver = null

    // HACK: we need to listen to mousup on document
    // to catch events outside the surface
    if (inBrowser) {
      this.documentEl = DefaultDOMElement.wrapNativeElement(window.document)
    }

    // set when editing is enabled
    this.undoEnabled = true

    // a registry for TextProperties which allows us to dispatch changes
    this._textProperties = {}

    this._state = {
      // true if the document session's selection is addressing this surface
      skipNextFocusEvent: false,
      skipNextObservation: false
    }
  }

  getChildContext() {
    return {
      surface: this,
      surfaceParent: this,
      doc: this.getDocument()
    }
  }

  didMount() {
    if (this.context.surfaceManager) {
      this.context.surfaceManager.registerSurface(this)
    }
    if (!this.isReadonly() && inBrowser) {
      this.domSelection = new DOMSelection(this)
      // TODO: it seems that domObserver has become obsolete here, as some of this is done on TextPropertyComponent now
      // this.domObserver = new window.MutationObserver(this.onDomMutations.bind(this));
      // this.domObserver.observe(this.el.getNativeElement(), { subtree: true, characterData: true, characterDataOldValue: true });
    }
    this.editorSession.onRender('selection', this._onSelectionChanged, this)
  }


  dispose() {
    this.editorSession.off(this)
    this.domSelection = null
    if (this.domObserver) {
      this.domObserver.disconnect()
    }
    if (this.context.surfaceManager) {
      this.context.surfaceManager.unregisterSurface(this)
    }
  }

  didUpdate(oldProps, oldState) {
    this._update(oldProps, oldState)
  }

  render($$) {
    let tagName = this.props.tagName || 'div'
    let el = $$(tagName)
      .addClass('sc-surface')
      .attr('tabindex', 2)

    if (!this.isDisabled()) {
      if (this.isEditable()) {
        // Keyboard Events
        el.on('keydown', this.onKeyDown)
        // OSX specific handling of dead-keys
        if (!platform.isIE) {
          el.on('compositionstart', this.onCompositionStart)
        }
        // Note: TextEvent in Chrome/Webkit is the easiest for us
        // as it contains the actual inserted string.
        // Though, it is not available in FF and not working properly in IE
        // where we fall back to a ContentEditable backed implementation.
        if (inBrowser && window.TextEvent && !platform.isIE) {
          el.on('textInput', this.onTextInput)
        } else {
          el.on('keypress', this.onTextInputShim)
        }
      }
      if (!this.isReadonly()) {
        // Mouse Events
        el.on('mousedown', this.onMouseDown)
        el.on('contextmenu', this.onContextMenu)
        // disable drag'n'drop
        // we will react on this to render a custom selection
        el.on('focus', this.onNativeFocus)
        el.on('blur', this.onNativeBlur)
        // activate the clipboard
        this.clipboard.attach(el)
      }

    }
    return el
  }

  renderNode($$, node) {
    let doc = this.getDocument()
    let componentRegistry = this.getComponentRegistry()
    let ComponentClass = componentRegistry.get(node.type)
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type)
      ComponentClass = UnsupportedNode
    }
    return $$(ComponentClass, {
      doc: doc,
      node: node
    }).ref(node.id)
  }

  getComponentRegistry() {
    return this.context.componentRegistry || this.props.componentRegistry
  }

  getName() {
    return this.name
  }

  getId() {
    return this._surfaceId
  }

  isDisabled() {
    return this.props.disabled
  }

  isEditable() {
    return (this.props.editing === "full" || this.props.editing === undefined)
  }

  isSelectable() {
    return (this.props.editing === "selection" || this.props.editing === "full")
  }

  isReadonly() {
    return this.props.editing === "readonly"
  }

  getElement() {
    return this.el
  }

  getDocument() {
    return this.editorSession.getDocument()
  }

  getEditorSession() {
    return this.editorSession
  }

  isEnabled() {
    return !this.state.disabled
  }

  isContainerEditor() {
    return false
  }

  hasNativeSpellcheck() {
    return this.props.spellcheck === 'native'
  }

  getContainerId() {
    return null
  }

  /**
    Run a transformation as a transaction properly configured for this surface.

    @param transformation a transformation function(tx, args) which receives
                          the selection the transaction was started with, and should return
                          output arguments containing a selection, as well.

    @example

    Returning a new selection:
    ```js
    surface.transaction(function(tx, args) {
      var selection = args.selection;
      ...
      selection = tx.createSelection(...);
      return {
        selection: selection
      };
    });
    ```

    Adding event information to the transaction:

    ```js
    surface.transaction(function(tx, args) {
      tx.info.foo = 'bar';
      ...
    });
    ```
   */
  transaction(transformation, info) {
    // TODO: we would like to get rid of this method, and only have
    // editorSession.transaction()
    // The problem is, that we need to get surfaceId into the change,
    // to be able to set the selection into the right surface.
    // ATM we put this into the selection, which is hacky, and makes it
    // unnecessarily inconvient to create selections.
    // Maybe editorSession should provide a means to augment the before/after
    // state of a change.
    let editorSession = this.editorSession
    let surfaceId = this.getId()
    return editorSession.transaction(function(tx, args) {
      tx.before.surfaceId = surfaceId
      return transformation(tx, args)
    }, info)
  }

  getSelection() {
    return this.editorSession.getSelection()
  }

  /**
   * Set the model selection and update the DOM selection accordingly
   */
  setSelection(sel) {
    // console.log('Surface.setSelection()', this.name, sel);
    // storing the surface id so that we can associate
    // the selection with this surface later
    if (sel && !sel.isNull()) {
      sel.surfaceId = this.getId()
      sel.containerId = sel.containerId || this.getContainerId()
    }
    this._setSelection(sel)
  }

  blur() {
    if (this.el) {
      this.el.blur()
    }
  }

  focus() {
    if (this.isDisabled()) return
    // console.log('Focusing surface %s explicitly with Surface.focus()', this.getId());
    // NOTE: FF is causing problems with dynamically activated contenteditables
    // and focusing
    if (platform.isFF) {
      this.domSelection.clear()
      this.el.getNativeElement().blur()
    }
    this._focus()
  }

  rerenderDOMSelection() {
    if (this.isDisabled()) return
    if (inBrowser) {
      // console.log('Surface.rerenderDOMSelection', this.__id__);
      let sel = this.getSelection()
      if (sel.surfaceId === this.getId()) {
        this.domSelection.setSelection(sel)
        // this will let our parents know that the DOM selection
        // is ready
        this.send('domSelectionRendered')
      }
    }
  }

  getDomNodeForId(nodeId) {
    return this.el.getNativeElement().querySelector('*[data-id="'+nodeId+'"]')
  }

  /* Editing behavior */

  /* Note: In a regular Surface all text properties are treated independently
     like in a form */

  selectAll() {
    this.editorSession.executeCommand('select-all', {
      surface: this
    })
  }

  insertText(tx, args) {
    console.warn('DEPRECATED: use editorSession')
    let sel = args.selection
    if (sel.isPropertySelection() || sel.isContainerSelection()) {
      return insertText(tx, args)
    }
  }

  delete(tx, args) {
    let sel = args.selection
    if (!sel.isCollapsed()) {
      return deleteSelection(tx, args)
    }
    else if (sel.isPropertySelection() || sel.isNodeSelection()) {
      return deleteCharacter(tx, args)
    }
  }

  break(tx, args) {
    return this.softBreak(tx, args)
  }

  softBreak(tx, args) {
    args.text = "\n"
    return this.insertText(tx, args)
  }

  copy(doc, selection) {
    let result = copySelection(doc, { selection: selection })
    return result.doc
  }

  paste(tx, args) {
    // TODO: for now only plain text is inserted
    // We could do some stitching however, preserving the annotations
    // received in the document
    if (args.text) {
      return this.insertText(tx, args)
    }
  }

  /* Event handlers */

  /*
   * Handle document key down events.
   */
  onKeyDown(event) {
    // console.log('Surface.onKeyDown()', this.getId());

    // ignore fake IME events (emitted in IE and Chromium)
    if ( event.which === 229 ) return

    // core handlers for cursor movements and editor interactions
    switch ( event.keyCode ) {
      // Cursor movements
      case keys.LEFT:
      case keys.RIGHT:
        return this._handleLeftOrRightArrowKey(event)
      case keys.UP:
      case keys.DOWN:
        return this._handleUpOrDownArrowKey(event)
      case keys.HOME:
      case keys.END:
        return this._handleHomeOrEndKey(event)
      case keys.PAGEUP:
      case keys.PAGEDOWN:
        return this._handlePageUpOrDownKey(event)
      // Input (together with text-input)
      case keys.ENTER:
        return this._handleEnterKey(event)
      case keys.SPACE:
        return this._handleSpaceKey(event)
      case keys.BACKSPACE:
      case keys.DELETE:
        return this._handleDeleteKey(event)
      default:
        break
    }

    // keyboard shortcuts
    this.editorSession.keyboardManager.onKeydown(event)
  }

  onTextInput(event) {
    // console.log("TextInput:", event);
    event.preventDefault()
    event.stopPropagation()
    if (!event.data) return
    // necessary for handling dead keys properly
    this._state.skipNextObservation=true
    let text = event.data
    this.editorSession.editing.type(text)
  }

  // Handling Dead-keys under OSX
  onCompositionStart() {
    // just tell DOM observer that we have everything under control
    this._state.skipNextObservation = true
  }

  // TODO: do we need this anymore?
  onTextInputShim(event) {
    // Filter out non-character keys
    if (
      // Catches most keys that don't produce output (charCode === 0, thus no character)
      event.which === 0 || event.charCode === 0 ||
      // Opera 12 doesn't always adhere to that convention
      event.keyCode === keys.TAB || event.keyCode === keys.ESCAPE ||
      // prevent combinations with meta keys, but not alt-graph which is represented as ctrl+alt
      Boolean(event.metaKey) || (Boolean(event.ctrlKey)^Boolean(event.altKey))
    ) {
      return
    }
    let character = String.fromCharCode(event.which)
    this._state.skipNextObservation=true
    if (!event.shiftKey) {
      character = character.toLowerCase()
    }
    event.preventDefault()
    event.stopPropagation()
    if (character.length>0) {
      this.editorSession.editing.type(character)
    }
  }

  // TODO: the whole mouse event based selection mechanism needs
  // to be redesigned. The current implementation works basically
  // though, there are some things which do not work well cross-browser
  // particularly, double- and triple clicks.
  // also it turned out to be problematic to react on mouse down instantly
  onMouseDown(event) {
    // console.log('mousedown on', this.getId());
    // event.stopPropagation();

    // TODO: what is this exactly?
    if ( event.button !== 0 ) {
      return
    }

    // special treatment for triple clicks
    if (!(platform.isIE && platform.version<12) && event.detail >= 3) {
      let sel = this.getSelection()
      if (sel.isPropertySelection()) {
        this._selectProperty(sel.path)
        event.preventDefault()
        event.stopPropagation()
        return
      } else if (sel.isContainerSelection()) {
        this._selectProperty(sel.startPath)
        event.preventDefault()
        event.stopPropagation()
        return
      }
    }
    // 'mouseDown' is triggered before 'focus' so we tell
    // our focus handler that we are already dealing with it
    // The opposite situation, when the surface gets focused e.g. using keyboard
    // then the handler needs to kick in and recover a persisted selection or such
    this._state.skipNextFocusEvent = true

    // UX-wise, the proper way is to apply the selection on mousedown, and if a drag is started (range selection)
    // we could maybe map the selection during the drag, but finally once after mouse is released.
    // TODO: this needs to be solved properly; be aware of browser incompatibilities
    // HACK: not working in IE which then does not allow a range selection anymore
    // if (!platform.isIE) {
    //   // HACK: clearing the DOM selection, otherwise we have troubles with the old selection being in the way for the next selection
    //   this.domSelection.clear();
    //   setTimeout(function() {
    //     if (this.domSelection) {
    //       var sel = this.domSelection.getSelection();
    //       this.setSelection(sel);
    //     }
    //   }.bind(this));
    // }

    // Bind mouseup to the whole document in case of dragging out of the surface
    if (this.documentEl) {
      // TODO: we should handle mouse up only if we started a drag (and the selection has really changed)
      this.documentEl.on('mouseup', this.onMouseUp, this, { once: true })
    }
  }

  // When a user right clicks the DOM selection is updated (in Chrome the nearest
  // word gets selected). Like we do with the left mouse clicks we need to sync up
  // our model selection.
  onContextMenu() {
    if (this.domSelection) {
      let sel = this.domSelection.getSelection()
      this.setSelection(sel)
    }
  }

  onMouseUp() {
    // console.log('mouseup on', this.getId());
    // ATTENTION: this delay is necessary for cases the user clicks
    // into an existing selection. In this case the window selection still
    // holds the old value, and is set to the correct selection after this
    // being called.
    setTimeout(function() {
      if (this.domSelection) {
        let sel = this.domSelection.getSelection()
        this.setSelection(sel)
      }
    }.bind(this))
  }

  onDomMutations(e) {
    if (this._state.skipNextObservation) {
      this._state.skipNextObservation = false
      return
    }
    // Known use-cases:
    //  - Context-menu:
    //      - Delete
    //      - Note: copy, cut, paste work just fine
    //  - dragging selected text
    //  - spell correction
    console.info("We want to enable a DOM MutationObserver which catches all changes made by native interfaces (such as spell corrections, etc). Lookout for this message and try to set Surface.skipNextObservation=true when you know that you will mutate the DOM.", e)
  }

  onNativeBlur() {
    // console.log('Native blur on surface', this.getId());
    let _state = this._state
    _state.hasNativeFocus = false
  }

  onNativeFocus() {
    // console.log('Native focus on surface', this.getId());
    let _state = this._state
    _state.hasNativeFocus = true
  }

  // Internal implementations

  _update(oldProps, oldState) {
    this._updateContentEditableState(oldState)
  }

  _updateContentEditableState(oldState) {
    // ContentEditable management
    // Note: to be able to isolate nodes, we need to control
    // how contenteditable is used in a hieriarchy of surfaces.
    if (oldState.mode === 'co-focused') {
      this.el.off('mousedown', this._enableContentEditable, this)
    }
    if (!this.isEditable()) {
      this.el.setAttribute('contenteditable', false)
    } else if (this.state.mode !== oldState.mode) {
      switch(this.state.mode) {
        case 'co-focused':
          this.el.setAttribute('contenteditable', false)
          this.el.on('mousedown', this._enableContentEditable, this)
          break
        default:
          this.el.setAttribute('contenteditable', true)
      }
    }
  }

  _enableContentEditable() {
    this.el.setAttribute('contenteditable', true)
  }

  _onSelectionChanged(selection) {
    let newMode = this._deriveModeFromSelection(selection)
    if (this.state.mode !== newMode) {
      this.extendState({
        mode: newMode
      })
    }
  }

  // helper to manage surface mode which is derived from the current selection
  _deriveModeFromSelection(sel) {
    if (!sel) return null
    let surfaceId = sel.surfaceId
    let id = this.getId()
    let mode
    if (startsWith(surfaceId, id)) {
      if (surfaceId.length === id.length) {
        mode = 'focused'
      } else {
        mode = 'co-focused'
      }
    }
    return mode
  }

  // surface parent is either a Surface or IsolatedNode
  _getSurfaceParent() {
    return this.context.surfaceParent
  }

  _focus() {
    this._state.hasNativeFocus = true
    // HACK: we must not focus explicitly in Chrome/Safari
    // as otherwise we get a crazy auto-scroll
    // Still, this is ok, as everything is working fine
    // there, without that (as opposed to FF/Edge)
    if (this.el && !platform.isWebkit) {
      this._state.skipNextFocusEvent = true
      // ATTENTION: unfortunately, focusing the contenteditable does lead to auto-scrolling
      // in some browsers
      this.el.focus();
      this._state.skipNextFocusEvent = false
    }
  }

  _handleLeftOrRightArrowKey(event) {
    event.stopPropagation()

    let direction = (event.keyCode === keys.LEFT) ? 'left' : 'right'
    let selState = this.getEditorSession().getSelectionState()
    let sel = selState.getSelection()
    // Note: collapsing the selection and let ContentEditable still continue doing a cursor move
    if (selState.isInlineNodeSelection() && !event.shiftKey) {
      event.preventDefault()
      this.setSelection(sel.collapse(direction))
      return
    }

    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return
      let options = {
        direction: (event.keyCode === keys.LEFT) ? 'left' : 'right'
      }
      this._updateModelSelection(options)
    }.bind(this))
  }

  _handleUpOrDownArrowKey(event) {
    event.stopPropagation()
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return
      let options = {
        direction: (event.keyCode === keys.UP) ? 'left' : 'right'
      }
      this._updateModelSelection(options)
    }.bind(this));
  }

  _handleHomeOrEndKey(event) {
    event.stopPropagation()
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return
      let options = {
        direction: (event.keyCode === keys.HOME) ? 'left' : 'right'
      }
      this._updateModelSelection(options)
    }.bind(this))
  }

  _handlePageUpOrDownKey(event) {
    event.stopPropagation()
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return
      let options = {
        direction: (event.keyCode === keys.PAGEUP) ? 'left' : 'right'
      }
      this._updateModelSelection(options)
    }.bind(this))
  }

  _handleSpaceKey(event) {
    event.preventDefault()
    event.stopPropagation()
    this.editorSession.editing.type(' ')
  }

  _handleEnterKey(event) {
    event.preventDefault()
    event.stopPropagation()
    this.editorSession.editing.break()
  }

  _handleDeleteKey(event) {
    event.preventDefault()
    event.stopPropagation()
    let direction = (event.keyCode === keys.BACKSPACE) ? 'left' : 'right'
    this.editorSession.editing.delete(direction)
  }

  _hasNativeFocus() {
    return Boolean(this._state.hasNativeFocus)
  }

  _setSelection(sel) {
    // Since we allow the surface be blurred natively when clicking
    // on tools we now need to make sure that the element is focused natively
    // when we set the selection
    // This is actually only a problem on FF, other browsers set the focus implicitly
    // when a new DOM selection is set.
    // ATTENTION: in FF 44 this was causing troubles, making the CE unselectable
    // until the next native blur.
    if (!sel.isNull() && sel.surfaceId === this.getId() && platform.isFF) {
      this._focus()
    }
    this.editorSession.setSelection(sel)
  }

  _updateModelSelection(options) {
    let sel = this.domSelection.getSelection(options)
    // console.log('Surface: updating model selection', sel.toString());
    // NOTE: this will also lead to a rerendering of the selection
    // via session.on('update')
    this.setSelection(sel)
  }

  _selectProperty(path) {
    let doc = this.getDocument()
    let text = doc.get(path)
    this.setSelection(doc.createSelection(path, 0, text.length))
  }

  // internal API for TextProperties to enable dispatching
  // TextProperty components are registered via path
  _registerTextProperty(textPropertyComponent) {
    let path = textPropertyComponent.getPath()
    this._textProperties[path] = textPropertyComponent
  }

  _unregisterTextProperty(textPropertyComponent) {
    let path = textPropertyComponent.getPath()
    if (this._textProperties[path] === textPropertyComponent) {
      delete this._textProperties[path]
    }
  }

  _getTextPropertyComponent(path) {
    return this._textProperties[path]
  }

  // TODO: we could integrate container node rendering into this helper
  // TODO: this helper should be available also in non surface context
  _renderNode($$, nodeId) {
    let doc = this.getDocument()
    let node = doc.get(nodeId)
    let componentRegistry = this.context.componentRegistry || this.props.componentRegistry
    let ComponentClass = componentRegistry.get(node.type)
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type)
      ComponentClass = UnsupportedNode
    }
    return $$(ComponentClass, {
      doc: doc,
      node: node
    })
  }

  /*
    Called when starting a transaction to populate the transaction
    arguments.
    ATM used only by ContainerEditor.
  */
  _prepareArgs(args) { // eslint-disable-line
  }

  // Experimental: used by DragManager
  getSelectionFromEvent(event) {
    if (this.domSelection) {
      let domRange = Surface.getDOMRangeFromEvent(event)
      let sel = this.domSelection.getSelectionForDOMRange(domRange)
      sel.surfaceId = this.getId()
      return sel;
    }
  }

  setSelectionFromEvent(event) {
    let sel = this.getSelectionFromEvent(event)
    if (sel) {
      this._state.skipNextFocusEvent = true
      this.setSelection(sel)
    } else {
      console.error('Could not create a selection from event.');
    }
  }

}

Object.defineProperty(Surface.prototype, 'id', {
  configurable: false,
  get: function() {
    return this._surfaceId
  }
})

Surface.getDOMRangeFromEvent = function(evt) {
  let range, x = evt.clientX, y = evt.clientY

  // Try the simple IE way first
  if (document.body.createTextRange) {
    range = document.body.createTextRange()
    range.moveToPoint(x, y)
  }

  else if (!isUndefined(document.createRange)) {
    // Try Mozilla's rangeOffset and rangeParent properties,
    // which are exactly what we want
    if (!isUndefined(evt.rangeParent)) {
      range = document.createRange()
      range.setStart(evt.rangeParent, evt.rangeOffset)
      range.collapse(true)
    }
    // Try the standards-based way next
    else if (document.caretPositionFromPoint) {
      let pos = document.caretPositionFromPoint(x, y)
      range = document.createRange()
      range.setStart(pos.offsetNode, pos.offset)
      range.collapse(true)
    }
    // Next, the WebKit way
    else if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y)
    }
  }

  return range
}

Surface.prototype._isSurface = true

export default Surface
