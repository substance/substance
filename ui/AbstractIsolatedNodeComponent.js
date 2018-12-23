import keys from '../util/keys'
import platform from '../util/platform'
import Component from './Component'

export default class AbstractIsolatedNodeComponent extends Component {
  constructor (...args) {
    super(...args)

    this.name = this._getName()
    this._state = { selectionFragment: null }
    this.ContentClass = this._getContentClass()
    // NOTE: FF does not allow to navigate contenteditable isles
    let useBlocker = platform.isFF || !this.ContentClass.noBlocker
    this.blockingMode = useBlocker ? 'closed' : 'open'

    this.handleAction('escape', this.escape)
  }

  getInitialState () {
    let sel = this.getEditorSession().getSelection()
    let selState = this.getEditorSession().getSelectionState()
    return this._deriveStateFromSelectionState(sel, selState)
  }

  getChildContext () {
    return {
      parentSurfaceId: this.getId(),
      isolatedNodeComponent: this,
      // Note: we clear 'surface' here so that we can detect quickly if
      // a child component has a parent surface
      surface: undefined
    }
  }

  didMount () {
    super.didMount()

    let editorSession = this.getEditorSession()
    editorSession.onRender('selection', this._onSelectionChanged, this)
  }

  dispose () {
    super.dispose.call(this)

    let editorSession = this.getEditorSession()
    editorSession.off(this)
  }

  renderContent ($$, node, options = {}) {
    let ComponentClass = this.ContentClass
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type)
      return $$(this.__elementTag)
    } else {
      let props = Object.assign(this._getContentProps(), options)
      return $$(ComponentClass, props)
    }
  }

  getId () {
    // HACK: doing this lazily here instead of in the constructor.
    // This is because `getInitialState()` already needs this information
    if (!this._id) {
      this._id = this.context.parentSurfaceId + '/' + this.name
    }
    return this._id
  }

  get id () { return this.getId() }

  getMode () {
    return this.state.mode
  }

  escape () {
    // console.log('Escaping from IsolatedNode', this.id)
    this.selectNode()
  }

  isOpen () {
    return this.blockingMode === 'open'
  }

  isClosed () {
    return this.blockingMode === 'closed'
  }

  isNotSelected () {
    return !this.state.mode
  }

  isSelected () {
    return this.state.mode === 'selected'
  }

  isCoSelected () {
    return this.state.mode === 'co-selected'
  }

  isFocused () {
    return this.state.mode === 'focused'
  }

  isCoFocused () {
    return this.state.mode === 'co-focused'
  }

  getParentSurface () {
    return this.context.surface
  }

  getDocument () {
    return this.context.editorSession.getDocument()
  }

  getEditorSession () {
    return this.context.editorSession
  }

  getSurfaceManager () {
    return this.context.surfaceManager
  }

  _onSelectionChanged () {
    const editorSession = this.getEditorSession()
    const sel = editorSession.getSelection()
    const selState = editorSession.getSelectionState()
    const newState = this._deriveStateFromSelectionState(sel, selState)
    if (!newState && this.state.mode) {
      this.extendState({ mode: null })
    } else if (newState && newState.mode !== this.state.mode) {
      this.extendState(newState)
    }
  }

  onKeydown (event) {
    // console.log('####', event.keyCode, event.metaKey, event.ctrlKey, event.shiftKey);
    // TODO: while this works when we have an isolated node with input or CE,
    // there is no built-in way of receiving key events in other cases
    // We need a global event listener for keyboard events which dispatches to the current isolated node
    if (event.keyCode === keys.ESCAPE && this.state.mode === 'focused') {
      event.stopPropagation()
      event.preventDefault()
      this.escape()
    }
  }

  _getName () {
    return this.props.model.id
  }

  _getContentClass () {
    const model = this.props.model
    let ComponentClass
    // first try to get the component registered for this model
    ComponentClass = this.getComponent(model.type, true)
    // otherwise just use an empty Component
    if (!ComponentClass) ComponentClass = Component
    return ComponentClass
  }

  _getContentProps () {
    const model = this.props.model
    return {
      disabled: this.props.disabled,
      model,
      // LEGACY: we want to use the more generic name 'model' instead of 'node'
      node: model,
      isolatedNodeState: this.state.mode,
      focused: (this.state.mode === 'focused')
    }
  }

  _getSurfaceForSelection (sel, selState) {
    // HACK: deriving additional information from the selection and
    // storing it into selState
    // TODO: this should be part of the regular selection state reducer
    let surface = selState.surface
    if (!surface) {
      if (sel && sel.surfaceId) {
        const surfaceManager = this.getSurfaceManager()
        surface = surfaceManager.getSurface(sel.surfaceId)
      } else {
        surface = null
      }
      selState.surface = surface
    }
    return surface
  }

  // compute the list of surfaces and isolated nodes
  // for the given selection
  _getIsolatedNodes (sel, selState) {
    // HACK: deriving additional information from the selection and
    // storing it into selState
    // TODO: this should be part of the regular selection state reducer
    let isolatedNodes = selState.isolatedNodes
    if (!isolatedNodes) {
      isolatedNodes = []
      if (sel && sel.surfaceId) {
        let surfaceManager = this.getSurfaceManager()
        let surface = surfaceManager.getSurface(sel.surfaceId)
        if (surface) {
          isolatedNodes = surface.getComponentPath().filter(comp => comp._isAbstractIsolatedNodeComponent)
        }
      }
      selState.isolatedNodes = isolatedNodes
    }
    return isolatedNodes
  }

  _shouldConsumeEvent (event) {
    let comp = Component.unwrap(event.target)
    let isolatedNodeComponent = this._getIsolatedNode(comp)
    return (isolatedNodeComponent === this)
  }

  _getIsolatedNode (comp) {
    if (comp._isAbstractIsolatedNodeComponent) {
      return this
    } else if (comp.context.isolatedNodeComponent) {
      return comp.context.isolatedNodeComponent
    } else if (comp.context.surface) {
      return comp.context.surface.context.isolatedNodeComponent
    }
  }

  get _isAbstractIsolatedNodeComponent () { return true }
}
