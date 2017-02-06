import keys from '../util/keys'
import createSurfaceId from '../util/createSurfaceId'
import Component from '../ui/Component'

class AbstractIsolatedNodeComponent extends Component {

  constructor(...args) {
    super(...args)

    this.name = this.props.node.id
    this._id = createSurfaceId(this)
    this._state = {
      selectionFragment: null
    }

    this.handleAction('escape', this._escape)
    this.ContentClass = this._getContentClass(this.props.node) || Component
  }

  getChildContext() {
    return {
      surfaceParent: this
    }
  }

  getInitialState() {
    let selState = this.context.editorSession.getSelectionState()
    return this._deriveStateFromSelectionState(selState)
  }

  didMount() {
    super.didMount.call(this);

    let editorSession = this.context.editorSession
    editorSession.onRender('selection', this._onSelectionChanged, this)
  }

  dispose() {
    super.dispose.call(this)

    let editorSession = this.context.editorSession
    editorSession.off(this)
  }

  renderContent($$, node) {
    let ComponentClass = this.ContentClass
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type)
      return $$(this.__elementTag)
    } else {
      let props = {
        node: node,
        disabled: this.isDisabled(),
        isolatedNodeState: this.state.mode
      }
      if (this.state.mode === 'focused') {
        props.focused = true;
      }
      return $$(ComponentClass, props)
    }
  }

  shouldRenderBlocker() {
    return true
  }

  shouldSelectOnClick() {
    return this.state.mode !== 'focused' && this.state.mode !== 'co-focused'
  }

  getId() {
    return this._id
  }

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

  isDisabled() {
    return !this.state.mode || ['co-selected'].indexOf(this.state.mode) > -1;
  }

  _getContentClass(node) {
    let componentRegistry = this.context.componentRegistry
    let ComponentClass = componentRegistry.get(node.type)
    return ComponentClass
  }

  _getSurfaceParent() {
    return this.context.surface
  }

  _getLevel() {
    let level = 1;
    let parent = this._getSurfaceParent()
    while (parent) {
      level++
      parent = parent._getSurfaceParent()
    }
    return level
  }

  _onSelectionChanged() {
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

  onClick(event) {
    event.preventDefault()
    event.stopPropagation()
    if (this.shouldSelectOnClick()) {
      this._selectNode()
    }
  }

  onClickBlocker(event) {
    event.preventDefault()
    event.stopPropagation()
    if (this.shouldSelectOnClick() && event.target === this.refs.blocker.getNativeElement()) {
      this._selectNode()
    }
  }

  onKeydown(event) {
    event.stopPropagation()
    // console.log('####', event.keyCode, event.metaKey, event.ctrlKey, event.shiftKey);
    // TODO: while this works when we have an isolated node with input or CE,
    // there is no built-in way of receiving key events in other cases
    // We need a global event listener for keyboard events which dispatches to the current isolated node
    if (event.keyCode === keys.ESCAPE && this.state.mode === 'focused') {
      event.preventDefault()
      this._escape()
    }
  }

  _escape() {
    this._selectNode()
  }

  _stopPropagation(event) {
    event.stopPropagation()
  }

}

export default AbstractIsolatedNodeComponent
