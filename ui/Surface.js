import keys from '../util/keys'
import platform from '../util/platform'
import startsWith from '../util/startsWith'
import parseKeyEvent from '../util/parseKeyEvent'
import { getDOMRangeFromEvent } from '../util/windowUtils'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import Component from './Component'
import Clipboard from './Clipboard'
import UnsupportedNode from './UnsupportedNodeComponent'

const BROWSER_DELAY = platform.isFF ? 1 : 0

/**
   Abstract interface for editing components.
   Dances with contenteditable, so you don't have to.
*/
class Surface extends Component {

  constructor(...args) {
    super(...args)

    this._initialize()
  }

  _initialize() {
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
    this._surfaceId = Surface.createSurfaceId(this)

    this.clipboard = new Clipboard(this.editorSession)

    this.domSelection = this.context.domSelection
    if (!this.domSelection) throw new Error('DOMSelection instance must be provided via context.')

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
    const editorSession = this.getEditorSession()
    const surfaceManager = this.getSurfaceManager()
    if (surfaceManager) {
      surfaceManager.registerSurface(this)
    }
    editorSession.onRender('selection', this._onSelectionChanged, this)

    const globalEventHandler = editorSession.globalEventHandler
    globalEventHandler.addEventListener('keydown', this._muteNativeHandlers, this)
  }


  dispose() {
    const editorSession = this.getEditorSession()
    const surfaceManager = this.getSurfaceManager()
    editorSession.off(this)
    if (surfaceManager) {
      surfaceManager.unregisterSurface(this)
    }

    const globalEventHandler = editorSession.globalEventHandler
    globalEventHandler.removeEventListener('keydown', this._muteNativeHandlers)
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
          el.on('compositionend', this.onCompositionEnd)
        }
        // Note: TextEvent in Chrome/Webkit is the easiest for us
        // as it contains the actual inserted string.
        // Though, it is not available in FF and not working properly in IE
        // where we fall back to a ContentEditable backed implementation.
        if (platform.inBrowser && window.TextEvent && !platform.isIE) {
          el.on('textInput', this.onTextInput)
        } else {
          el.on('keypress', this.onTextInputShim)
        }
        el.on('paste', this._onPaste)
        el.on('cut', this._onCut)
      }
      if (!this.isReadonly()) {
        // Mouse Events
        el.on('mousedown', this.onMouseDown)
        el.on('contextmenu', this.onContextMenu)
        // disable drag'n'drop
        // we will react on this to render a custom selection
        el.on('focus', this.onNativeFocus)
        el.on('blur', this.onNativeBlur)
      }
      el.on('copy', this._onCopy)
    }
    return el
  }

  renderNode($$, node) {
    let componentRegistry = this.getComponentRegistry()
    let ComponentClass = componentRegistry.get(node.type)
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type)
      ComponentClass = UnsupportedNode
    }
    return $$(ComponentClass, this._extractNodeProps(node)).ref(node.id)
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

  getSurfaceId() {
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
    return this.getEditorSession().getDocument()
  }

  getEditorSession() {
    return this.editorSession
  }

  getSurfaceManager() {
    return this.context.surfaceManager
  }

  isEnabled() {
    return !this.state.disabled
  }

  isContainerEditor() {
    return false
  }

  isCustomEditor() {
    return false
  }

  hasNativeSpellcheck() {
    return this.props.spellcheck === 'native'
  }

  getContainerId() {
    return null
  }

  focus() {
    if (this.getEditorSession().getFocusedSurface() !== this) {
      this.selectFirst()
    }
  }

  blur() {
    if (this.getEditorSession().getFocusedSurface() === this) {
      this.getEditorSession().setSelection(null)
    }
  }

  selectFirst() {
    throw new Error('This method is abstract.')
  }

  // As the DOMSelection is owned by the Editor now, rerendering could now be done by someone else, e.g. the SurfaceManager?
  rerenderDOMSelection() {
    if (this.isDisabled()) return
    if (platform.inBrowser) {
      // console.log('Surface.rerenderDOMSelection', this.__id__);
      let sel = this.getEditorSession().getSelection()
      if (sel.surfaceId === this.getId()) {
        this.domSelection.setSelection(sel)
        // HACK: accessing the scrollpane directly
        // TODO: this should be done in a different way
        // this will let the scrollpane know that the DOM selection is ready
        const scrollPane = this.context.scrollPane
        if (scrollPane) {
          this.context.scrollPane.onSelectionPositioned()
        }
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
    // console.log('Surface.onKeyDown()', this.getId(), event);

    // ignore fake IME events (emitted in IE and Chromium)
    if ( event.key === 'Dead' ) return

    // keyboard shortcuts
    let custom = this.getEditorSession().keyboardManager.onKeydown(event)
    if (!custom) {
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
        case keys.TAB:
          return this._handleTabKey(event)
        case keys.BACKSPACE:
        case keys.DELETE:
          return this._handleDeleteKey(event)
        case keys.ESCAPE:
          return this._handleEscapeKey(event)
        case keys.SPACE:
          return this._handleSpaceKey(event)
        default:
          break
      }
    }
  }

  onTextInput(event) {
    if (!this._shouldConsumeEvent(event)) return
    // console.log("Surface.onTextInput():", event);
    event.preventDefault()
    event.stopPropagation()
    if (!event.data) return
    const editorSession = this.getEditorSession()
    let text = event.data
    if (!editorSession.keyboardManager.onTextInput(text)) {
      editorSession.transaction((tx) => {
        tx.insertText(text)
      }, { action: 'type' })
    }
  }

  // Handling Dead-keys under OSX
  onCompositionStart(event) {
    if (!this._shouldConsumeEvent(event)) return
    // console.log("Surface.onCompositionStart():", event);
    // EXPERIMENTAL:
    // We need to handle composed characters better
    // Here we try to overwrite content which as been already inserted
    // e.g. on OSX when holding down `a` a regular text-input event is triggered,
    // after a second a context menu appears and a composition-start event is fired
    // In that case, the first inserted character must be removed again
    if (event.data) {
      let l = event.data.length
      let sel = this.getEditorSession().getSelection()
      if (sel.isPropertySelection() && sel.isCollapsed()) {
        // console.log("Overwriting composed character")
        let offset = sel.start.offset
        this.getEditorSession().setSelection(sel.createWithNewRange(offset-l, offset))
      }
    }
  }

  onCompositionEnd(event) {
    if (!this._shouldConsumeEvent(event)) return
    // console.log("Surface.onCompositionEnd():", event);
    // Firefox does not fire textinput events at the end of compositions,
    // but has providing everything in the compositionend event
    if (platform.isFF) {
      event.preventDefault()
      event.stopPropagation()
      if (!event.data) return
      this._delayed(() => {
        let text = event.data
        if (!this.getEditorSession().keyboardManager.onTextInput(text)) {
          this.getEditorSession().transaction((tx) => {
            tx.insertText(text)
          }, { action: 'type' })
        }
      })
    }
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
    if (!this.getEditorSession().keyboardManager.onTextInput(character)) {
      if (character.length>0) {
        this.getEditorSession().transaction((tx) => {
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
    if (!this._shouldConsumeEvent(event)) {
      // console.log('skipping mousedown', this.id)
      return
    }

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

    // HACK: we need to listen to mousup on document to catch events outside the surface
    if (platform.inBrowser) {
      let documentEl = DefaultDOMElement.wrapNativeElement(window.document)
      documentEl.on('mouseup', this.onMouseUp, this, { once: true })
    }
  }

  onMouseUp(e) {
    // console.log('Surface.onMouseup', this.id);
    // ATTENTION: filtering events does not make sense here,
    // as we need to make sure that pick the selection even
    // when the mouse is released outside the surface
    // if (!this._shouldConsumeEvent(e)) return
    e.stopPropagation()
    // ATTENTION: this delay is necessary for cases the user clicks
    // into an existing selection. In this case the window selection still
    // holds the old value, and is set to the correct selection after this
    // being called.
    this._delayed(() => {
      let sel = this.domSelection.getSelection()
      this._setSelection(sel)
    })
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

  _onCopy(e) {
    this.clipboard.onCopy(e)
  }

  _onCut(e) {
    this.clipboard.onCut(e)
  }

  _onPaste(e) {
    this.clipboard.onPaste(e)
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
        let surface = this.getSurfaceManager().getSurface(sel.surfaceId)
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

  _blur() {
    if (this.el) {
      this.el.blur()
    }
  }

  _focus() {
    if (this.isDisabled()) return
    // console.log('Focusing surface %s explicitly with Surface.focus()', this.getId());
    // NOTE: FF is causing problems with dynamically activated contenteditables
    // and focusing
    if (platform.isFF) {
      this.domSelection.clear()
      this.el.getNativeElement().blur()
    }
    this._focusElement()
  }

  _focusElement() {
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
    this._delayed(() => {
      this._updateModelSelection({direction})
    })
  }

  _handleUpOrDownArrowKey(event) {
    event.stopPropagation()
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    this._delayed(() => {
      let options = {
        direction: (event.keyCode === keys.UP) ? 'left' : 'right'
      }
      this._updateModelSelection(options)
    })
  }

  _handleHomeOrEndKey(event) {
    event.stopPropagation()
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    this._delayed(() => {
      let options = {
        direction: (event.keyCode === keys.HOME) ? 'left' : 'right'
      }
      this._updateModelSelection(options)
    })
  }

  _handlePageUpOrDownKey(event) {
    event.stopPropagation()
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    this._delayed(() => {
      let options = {
        direction: (event.keyCode === keys.PAGEUP) ? 'left' : 'right'
      }
      this._updateModelSelection(options)
    })
  }

  _handleSpaceKey(event) {
    event.stopPropagation()
    event.preventDefault()
    const text = ' '
    if (!this.getEditorSession().keyboardManager.onTextInput(text)) {
      this.getEditorSession().transaction((tx) => {
        tx.insertText(text)
      }, { action: 'type' })
    }
  }

  _handleTabKey(event) {
    event.stopPropagation()
    if (this.props.handleTab === false) {
      event.preventDefault()
      this.el.emit('tab', {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        code: event.code
      })
    } else {
      this._delayed(()=>{
        this._updateModelSelection()
      })
    }
  }

  _handleEnterKey(event) {
    event.preventDefault()
    event.stopPropagation()
    this.getEditorSession().transaction((tx) => {
      tx.break()
    }, { action: 'break' })
  }

  _handleEscapeKey() {}

  _handleDeleteKey(event) {
    event.preventDefault()
    event.stopPropagation()
    let direction = (event.keyCode === keys.BACKSPACE) ? 'left' : 'right'
    this.getEditorSession().transaction((tx) => {
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
      this._focusElement()
    }
    this.getEditorSession().setSelection(sel)
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

  _extractNodeProps(node) {
    let doc = this.getDocument()
    return {
      placeholder: this.props.placeholder,
      doc: doc,
      node: node
    }
  }

  // only take care of events which are emitted on targets which belong to this surface
  _shouldConsumeEvent(event) {
    // console.log('should consume?', event.target, this.id)
    let comp = Component.unwrap(event.target)
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

  _delayed(fn) {
    window.setTimeout(fn, BROWSER_DELAY)
  }

  // prevent the native behavior of contenteditable key shorcuts
  _muteNativeHandlers(event) {
    let contentEditableShortcuts

    if (platform.isMac) {
      contentEditableShortcuts = [
        'META+66', // Cmd+Bold
        'META+73', // Cmd+Italic
        'META+85' // Cmd+Underline
      ]
    } else {
      contentEditableShortcuts = [
        'CTRL+66', // Ctrl+Bold
        'CTRL+73', // Ctrl+Italic
        'CTRL+85' // Ctrl+Underline
      ]
    }

    const key = parseKeyEvent(event)
    if(contentEditableShortcuts.indexOf(key) > -1) {
      event.preventDefault()
    }
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
Surface.createSurfaceId = function(surface) {
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
