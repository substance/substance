import keys from '../util/keys'
import Component from '../ui/Component'

class AbstractIsolatedNodeComponent extends Component {

  constructor(...args) {
    super(...args)

    this.name = this.props.node.id
    this._id = this.context.surface.id +'/'+this.name
    this._state = {
      selectionFragment: null
    }

    this.handleAction('escape', this.escape)
    this.ContentClass = this._getContentClass(this.props.node) || Component
  }

  getChildContext() {
    return {
      isolatedNodeComponent: this,
    }
  }

  getInitialState() {
    let selState = this.context.editorSession.getSelectionState()
    return this._deriveStateFromSelectionState(selState)
  }

  didMount() {
    super.didMount()

    let editorSession = this.context.editorSession
    editorSession.onRender('selection', this.onSelectionChanged, this)
  }

  dispose() {
    super.dispose.call(this)

    let editorSession = this.context.editorSession
    editorSession.off(this)
  }

  renderContent($$, node, options = {}) {
    let ComponentClass = this.ContentClass
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type)
      return $$(this.__elementTag)
    } else {
      let props = Object.assign({
        disabled: this.props.disabled,
        node: node,
        isolatedNodeState: this.state.mode,
        focused: (this.state.mode === 'focused')
      }, options)
      return $$(ComponentClass, props)
    }
  }

  getId() {
    return this._id
  }

  get id() { return this.getId() }

  getMode() {
    return this.state.mode
  }

  isNotSelected() {
    return !this.state.mode
  }

  isSelected() {
    return this.state.mode === 'selected'
  }

  isCoSelected() {
    return this.state.mode === 'co-selected'
  }

  isFocused() {
    return this.state.mode === 'focused'
  }

  isCoFocused() {
    return this.state.mode === 'co-focused'
  }

  escape() {
    this.selectNode()
  }

  onSelectionChanged() {
    let editorSession = this.context.editorSession
    let newState = this._deriveStateFromSelectionState(editorSession.getSelectionState())
    if (!newState && this.state.mode) {
      this.extendState({ mode: null })
    } else if (newState && newState.mode !== this.state.mode) {
      this.extendState(newState)
    }
  }

  onMousedown(event) {
    // console.log('AbstractIsolatedNodeComponent.onMousedown', this.getId());
    event.stopPropagation()
  }

  onKeydown(event) {
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

  _getContentClass(node) {
    let componentRegistry = this.context.componentRegistry
    let ComponentClass = componentRegistry.get(node.type)
    return ComponentClass
  }

  _getSurface(selState) {
    let surface = selState.get('surface')
    if (surface === undefined) {
      let sel = selState.getSelection()
      if (sel && sel.surfaceId) {
        let surfaceManager = this.context.surfaceManager
        surface = surfaceManager.getSurface(sel.surfaceId)
      } else {
        surface = null
      }
      selState.set('surface', surface)
    }
    return surface
  }

  // compute the list of surfaces and isolated nodes
  // for the given selection
  _getIsolatedNodes(selState) {
    let isolatedNodes = selState.get('isolatedNodes')
    if (!isolatedNodes) {
      let sel = selState.getSelection()
      isolatedNodes = []
      if (sel && sel.surfaceId) {
        let surfaceManager = this.context.surfaceManager
        let surface = surfaceManager.getSurface(sel.surfaceId)
        isolatedNodes = _computeIsolatedNodeChain(surface)
      }
      selState.set('isolatedNodes', isolatedNodes)
    }
    return isolatedNodes
  }
}

function _computeIsolatedNodeChain(surface) {
  let chain = []
  let isolatedNodeComponent = surface.context.isolatedNodeComponent
  while (isolatedNodeComponent) {
    chain.push(isolatedNodeComponent)
    isolatedNodeComponent = isolatedNodeComponent.context.isolatedNodeComponent
  }
  return chain
}

export default AbstractIsolatedNodeComponent
