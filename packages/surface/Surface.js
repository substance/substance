import inBrowser from '../../util/inBrowser'
import keys from '../../util/keys'
import platform from '../../util/platform'
import startsWith from '../../util/startsWith'
import Clipboard from '../../ui/Clipboard'
import Component from '../../ui/Component'
import DefaultDOMElement from '../../dom/DefaultDOMElement'
import UnsupportedNode from '../../ui/UnsupportedNodeComponent'
import { getDOMRangeFromEvent } from '../../util/windowUtils'

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

    this.clipboard = new Clipboard(this.editorSession, {
      converterRegistry: this.context.converterRegistry
    })

    this.domSelection = this.context.domSelection
    if (!this.domSelection) throw new Error('DOMSelection instance must be provided via context.')

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
      skipNextFocusEvent: false
    }
  }

  getChildContext() {
    return {
      surface: this,
      doc: this.getDocument(),
      // HACK: clearing isolatedNodeComponent so that we can easily know
      // if this surface is within an isolated node
      isolatedNodeComponent: null
    }
  }

  didMount() {
    if (this.context.surfaceManager) {
      this.context.surfaceManager.registerSurface(this)
    }
    this.editorSession.onRender('selection', this._onSelectionChanged, this)
  }


  dispose() {
    this.editorSession.off(this)
    if (this.domObserver) {
      this.domObserver.disconnect()
    }
    if (this.context.surfaceManager) {
      this.context.surfaceManager.unregisterSurface(this)
    }
  }

  didUpdate() {
    this._updateContentEditableState()
  }

  render($$) {
    let tagName = this.props.tagName || 'div'
    let el = $$(tagName)
      .addClass('sc-surface')
      .attr('tabindex', 2)
      .attr('data-surface-id', this.id)

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

  // As the DOMSelection is owned by the Editor now, rerendering could now be done by someone else, e.g. the SurfaceManager?
  rerenderDOMSelection() {
    if (this.isDisabled()) return
    if (inBrowser) {
      // console.log('Surface.rerenderDOMSelection', this.__id__);
      let sel = this.editorSession.getSelection()
      if (sel.surfaceId === this.getId()) {
        this.domSelection.setSelection(sel)
        // this will let our parents know that the DOM selection is ready
        this.send('domSelectionRendered', {
          surface: this
        })
      }
    }
  }

  getDomNodeForId(nodeId) {
    return this.el.getNativeElement().querySelector('*[data-id="'+nodeId+'"]')
  }

  /* Event handlers */

  /*
   * Handle document key down events.
   */
  onKeyDown(event) {
    if (!this._shouldConsumeEvent(event)) return
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
      case keys.TAB:
        return this._handleTabKey(event)
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
    if (!this._shouldConsumeEvent(event)) return
    // console.log("TextInput:", event);
    event.preventDefault()
    event.stopPropagation()
    if (!event.data) return

    let text = event.data
    if (!this.editorSession.keyboardManager.onTextInput(text)) {
      this.editorSession.transaction((tx) => {
        tx.insertText(text)
      }, { action: 'type' })
    }
  }

  // Handling Dead-keys under OSX
  onCompositionStart(event) {
    if (!this._shouldConsumeEvent(event)) return
  }

  // TODO: do we need this anymore?
  onTextInputShim(event) {
    if (!this._shouldConsumeEvent(event)) return
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
    if (!event.shiftKey) {
      character = character.toLowerCase()
    }
    event.preventDefault()
    event.stopPropagation()
    if (!this.editorSession.keyboardManager.onTextInput(character)) {
      if (character.length>0) {
        this.editorSession.transaction((tx) => {
          tx.insertText(character)
        }, { action: 'type' })
      }
    }
  }

  // TODO: the whole mouse event based selection mechanism needs
  // to be redesigned. The current implementation works basically
  // though, there are some things which do not work well cross-browser
  // particularly, double- and triple clicks.
  // also it turned out to be problematic to react on mouse down instantly
  onMouseDown(event) {
    if (!this._shouldConsumeEvent(event)) return

    // EXPERIMENTAL: trying to 'reserve' a mousedown event
    // so that parents know that they shouldn't react
    // This is similar to event.stopPropagation() but without
    // side-effects.
    // Note: some browsers do not do clicks, selections etc. on children if propagation is stopped
    if (event.__reserved__) {
      // console.log('%s: mousedown already reserved by %s', this.id, event.__reserved__.id)
      return
    } else {
      // console.log('%s: taking mousedown ', this.id)
      event.__reserved__ = this
    }

    // NOTE: this is here to make sure that this surface is contenteditable
    // For instance, IsolatedNodeComponent sets contenteditable=false on this element
    // to achieve selection isolation
    if (this.isEditable()) {
      this.el.setAttribute('contenteditable', true)
    }

    // TODO: what is this exactly?
    if ( event.button !== 0 ) {
      return
    }

    // special treatment for triple clicks
    if (!(platform.isIE && platform.version<12) && event.detail >= 3) {
      let sel = this.getEditorSession().getSelection()
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

    // Bind mouseup to the whole document in case of dragging out of the surface
    if (this.documentEl) {
      // TODO: we should handle mouse up only if we started a drag (and the selection has really changed)
      this.documentEl.on('mouseup', this.onMouseUp, this, { once: true })
    }
  }

  onMouseUp(e) {
    // ATTENTION: filtering events does not make sense here,
    // as we need to make sure that pick the selection even
    // when the mouse is released outside the surface
    // if (!this._shouldConsumeEvent(e)) return
    e.stopPropagation()
    // console.log('mouseup on', this.getId());
    // ATTENTION: this delay is necessary for cases the user clicks
    // into an existing selection. In this case the window selection still
    // holds the old value, and is set to the correct selection after this
    // being called.
    setTimeout(function() {
      let sel = this.domSelection.getSelection()
      this._setSelection(sel)
    }.bind(this))
  }

  // When a user right clicks the DOM selection is updated (in Chrome the nearest
  // word gets selected). Like we do with the left mouse clicks we need to sync up
  // our model selection.
  onContextMenu(event) {
    if (!this._shouldConsumeEvent(event)) return
    let sel = this.domSelection.getSelection()
    this._setSelection(sel)
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

  _updateContentEditableState() {
    // NOTE: managing contenteditable is difficult in
    // order to achieve a correct behavior for IsolatedNodes
    // For 'closed' isolated nodes it is important that the parents'
    // contenteditables are all false. Otherwise, the cursor
    // can leave the isolated area.
    let enableContenteditable = false
    if (this.isEditable() && !this.props.disabled) {
      enableContenteditable = true
      if (this.state.mode === 'co-focused') {
        let selState = this.context.editorSession.getSelectionState()
        let sel = selState.getSelection()
        let surface = this.context.surfaceManager.getSurface(sel.surfaceId)
        if (surface) {
          let isolatedNodeComponent = surface.context.isolatedNodeComponent
          if (isolatedNodeComponent) {
            enableContenteditable = isolatedNodeComponent.isOpen()
          }
        }
      }
    }
    if (enableContenteditable) {
      this.el.setAttribute('contenteditable', true)
    } else {
      // TODO: find out what is better
      this.el.removeAttribute('contenteditable')
    }
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
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
      this._updateModelSelection({direction})
    }.bind(this))
  }

  _handleUpOrDownArrowKey(event) {
    event.stopPropagation()
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
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
      let options = {
        direction: (event.keyCode === keys.PAGEUP) ? 'left' : 'right'
      }
      this._updateModelSelection(options)
    }.bind(this))
  }

  _handleSpaceKey(event) {
    event.preventDefault()
    event.stopPropagation()
    this.editorSession.transaction((tx) => {
      tx.insertText(' ')
    }, { action: 'type' })
  }

  _handleTabKey(event) {
    event.stopPropagation()
    window.setTimeout(()=>{
      this._updateModelSelection()
    })
  }

  _handleEnterKey(event) {
    event.preventDefault()
    event.stopPropagation()
    this.editorSession.transaction((tx) => {
      tx.break()
    }, { action: 'break' })
  }

  _handleDeleteKey(event) {
    event.preventDefault()
    event.stopPropagation()
    let direction = (event.keyCode === keys.BACKSPACE) ? 'left' : 'right'
    this.editorSession.transaction((tx) => {
      tx.deleteCharacter(direction)
    }, { action: 'delete' })
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
    // TODO: check if this is still necessary
    if (!sel.isNull() && sel.surfaceId === this.id && platform.isFF) {
      this._focus()
    }
    this.editorSession.setSelection(sel)
  }

  _updateModelSelection(options) {
    let sel = this.domSelection.getSelection(options)
    // console.log('Surface: updating model selection', sel.toString());
    // NOTE: this will also lead to a rerendering of the selection
    // via session.on('update')
    this._setSelection(sel)
  }

  _selectProperty(path) {
    let doc = this.getDocument()
    let text = doc.get(path)
    this._setSelection(doc.createSelection({
      type: 'property',
      path: path,
      startOffset: 0,
      endOffset: text.length
    }))
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

  // only take care of events which are emitted on targets which belong to this surface
  _shouldConsumeEvent(event) {
    let comp = Component.unwrap(event.target._wrapper)
    return (comp && (comp === this || comp.context.surface === this))
  }

  // Experimental: used by DragManager
  getSelectionFromEvent(event) {
    let domRange = getDOMRangeFromEvent(event)
    let sel = this.domSelection.getSelectionForDOMRange(domRange)
    sel.surfaceId = this.getId()
    return sel;
  }

  setSelectionFromEvent(event) {
    let sel = this.getSelectionFromEvent(event)
    if (sel) {
      this._state.skipNextFocusEvent = true
      this._setSelection(sel)
    } else {
      console.error('Could not create a selection from event.');
    }
  }

  get id() {
    return this._surfaceId
  }

}

Surface.prototype._isSurface = true

/*
  Computes the id of a surface

  With IsolatedNodes, surfaces can be nested.
  In this case the id can be seen as a path from the top-most to the nested ones

  @examples

  - top-level surface: 'body'
  - table cell: 'body/t1/t1-A1.content'
  - figure caption: 'body/fig1/fig1-caption.content'
  - nested containers: 'body/section1'
*/
function createSurfaceId(surface) {
  let isolatedNodeComponent = surface.context.isolatedNodeComponent
  if (isolatedNodeComponent) {
    let parentSurface = isolatedNodeComponent.context.surface
    // nested containers
    if (surface.isContainerEditor()) {
      if (isolatedNodeComponent._isInlineNodeComponent) {
        return parentSurface.id + '/' + isolatedNodeComponent.props.node.id + '/' + surface.name
      } else {
        return parentSurface.id + '/' + surface.name
      }
    }
    // other isolated nodes such as tables, figures, etc.
    else {
      return parentSurface.id + '/' + isolatedNodeComponent.props.node.id + '/' + surface.name
    }
  } else {
    return surface.name
  }
}

export default Surface
