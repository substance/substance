import startsWith from 'lodash/startsWith'
import keys from '../../util/keys'
import createSurfaceId from '../../util/createSurfaceId'
import Coordinate from '../../model/Coordinate'
import Component from '../../ui/Component'

class IsolatedNodeComponent extends Component {
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

  get _isIsolatedNodeComponent() {
    return true
  }

  get __elementTag() {
    return 'div'
  }

  get __slugChar() {
    return "|"
  }

  getChildContext() {
    return {
      surfaceParent: this
    }
  }

  getInitialState() {
    let selState = this.context.documentSession.getSelectionState()
    return this._deriveStateFromSelectionState(selState)
  }

  didMount() {
    super.didMount.call(this);

    let editSession = this.context.editSession
    editSession.onRender('selection', this._onSelectionChanged, this)
  }

  dispose() {
    super.dispose.call(this)

    let editSession = this.context.editSession
    editSession.off(this)
  }

  getClassNames() {
    return 'sc-isolated-node'
  }

  render($$) {
    let node = this.props.node
    let ContentClass = this.ContentClass
    // console.log('##### IsolatedNodeComponent.render()', $$.capturing);
    let el = super.render.apply(this, arguments)
    el.tagName = this.__elementTag
    el.addClass(this.getClassNames())
      .addClass('sm-'+this.props.node.type)
      .attr("data-id", node.id)

    let disabled = this.isDisabled()

    if (this.state.mode) {
      el.addClass('sm-'+this.state.mode)
    } else {
      el.addClass('sm-not-selected')
    }

    if (!ContentClass.noStyle) {
      el.addClass('sm-default-style')
    }

    // shadowing handlers of the parent surface
    // TODO: extract this into a helper so that we can reuse it anywhere where we want
    // to prevent propagation to the parent surface
    el.on('keydown', this.onKeydown)
      .on('mousedown', this._stopPropagation)
      .on('keypress', this._stopPropagation)
      .on('keyup', this._stopPropagation)
      .on('compositionstart', this._stopPropagation)
      .on('textInput', this._stopPropagation)

    el.append(
      $$(this.__elementTag).addClass('se-slug').addClass('sm-before').ref('before')
        // NOTE: better use a regular character otherwise Edge has problems
        .append(this.__slugChar)
    )

    let level = this._getLevel()

    let container = $$(this.__elementTag).addClass('se-container')
      .attr('contenteditable', false)
      .css({ 'z-index': 2*level })

    if (ContentClass.fullWidth) {
      container.addClass('sm-full-width')
    }

    if (this.state.mode === 'cursor' && this.state.position === 'before') {
      container.append(
        $$(this.__elementTag).addClass('se-cursor').addClass('sm-before').attr('contenteditable', false)
      )
    }
    container.append(this.renderContent($$, node))

    if (disabled) {
      container.addClass('sm-disabled')
      if (this.shouldRenderBlocker()) {
        // NOTE: there are some content implementations which work better without a blocker
        let blocker = $$(this.__elementTag).addClass('se-blocker')
          .css({ 'z-index': 2*level+1 })
        container.append(blocker)
      }
      if (this.shouldSelectOnClick()) {
        // select the node on click
        el.on('click', this.onClick)
      }
    }

    if (this.context.dragManager &&
        this.state.mode !== 'focused' &&
        this.state.mode !== 'co-focused') {
      el.attr("draggable", true);
      el.on('dragstart', this.onDragStart)
        .on('dragenter', this.onDragEnter)
        .on('dragover', this.onDragOver)
        .on('drop', this.onDrop)
    }

    if (this.state.mode === 'cursor' && this.state.position === 'after') {
      container.append(
        $$(this.__elementTag).addClass('se-cursor').addClass('sm-after').attr('contenteditable', false)
      );
    }

    el.append(container)
    el.append(
      $$(this.__elementTag).addClass('se-slug').addClass('sm-after').ref('after')
        // NOTE: better use a regular character otherwise Edge has problems
        .append(this.__slugChar)
    )
    return el
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
      return $$(ComponentClass, props).ref('content')
    }
  }

  shouldRenderBlocker() {
    return true
  }

  shouldSelectOnClick() {
    return this.state.mode !== 'focused' && this.state.mpde !== 'co-focused'
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

  _getContentClass(node) {
    let componentRegistry = this.context.componentRegistry
    let ComponentClass = componentRegistry.get(node.type)
    return ComponentClass
  }

  isDisabled() {
    return !this.state.mode || ['co-selected', 'cursor'].indexOf(this.state.mode) > -1;
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

  _onSelectionChanged(selection) {
    let documentSession = this.context.documentSession
    let newState = this._deriveStateFromSelectionState(documentSession.getSelectionState())
    if (!newState && this.state.mode) {
      this.extendState({ mode: null })
    } else if (newState && newState.mode !== this.state.mode) {
      this.extendState(newState)
    }
  }

  _deriveStateFromSelectionState(selState) {
    let sel = selState.getSelection()
    let surfaceId = sel.surfaceId
    if (!surfaceId) return
    let id = this.getId()
    let nodeId = this.props.node.id
    let parentId = this._getSurfaceParent().getId()
    let inParentSurface = (surfaceId === parentId)
    // detect cases where this node is selected or co-selected by inspecting the selection
    if (inParentSurface) {
      if (sel.isNodeSelection() && sel.getNodeId() === nodeId) {
        if (sel.isFull()) {
          return { mode: 'selected' }
        } else if (sel.isBefore()) {
          return { mode: 'cursor', position: 'before' }
        } else if (sel.isAfter()) {
          return { mode: 'cursor', position: 'after' }
        }
      }
      if (sel.isContainerSelection() && sel.containsNodeFragment(nodeId)) {
        return { mode: 'co-selected' }
      }
      return
    }
    if (sel.isCustomSelection() && id === surfaceId) {
      return { mode: 'focused' }
    }
    // HACK: a looks a bit hacky. Fine for now.
    // TODO: we should think about switching to surfacePath, instead of surfaceId
    else if (startsWith(surfaceId, id)) {
      let path1 = id.split('/')
      let path2 = surfaceId.split('/')
      let len1 = path1.length
      let len2 = path2.length
      if (len2 > len1 && path1[len1-1] === path2[len1-1]) {
        if (len2 === len1 + 1) {
          return { mode: 'focused' }
        } else {
          return { mode: 'co-focused' }
        }
      } else {
        return null
      }
    }
  }

  onMousedown(event) {
    // console.log('IsolatedNodeComponent.onMousedown', this.getId());
    event.stopPropagation()
  }

  onClick(event) {
    event.preventDefault()
    this._selectNode()
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

  onDragStart(event) {
    // console.log('Received drop on IsolatedNode', this.getId());
    this.context.dragManager.onDragStart(event, this)
  }

  onDragEnter(event) {
    event.preventDefault()
  }

  onDragOver(event) {
    event.preventDefault()
  }

  onDrop(event) {
    // console.log('Received drop on IsolatedNode', this.getId());
    this.context.dragManager.onDrop(event, this)
  }

  _escape() {
    this._selectNode()
  }

  _stopPropagation(event) {
    event.stopPropagation()
  }

  _selectNode() {
    // console.log('IsolatedNodeComponent: selecting node.');
    let surface = this.context.surface
    let doc = surface.getDocument()
    let nodeId = this.props.node.id
    surface.setSelection(doc.createSelection({
      type: 'node',
      containerId: surface.getContainerId(),
      nodeId: nodeId,
      mode: 'full'
    }))
  }

}

IsolatedNodeComponent.prototype._isDisabled = IsolatedNodeComponent.prototype.isDisabled

IsolatedNodeComponent.getCoordinate = function(surfaceEl, node) {
  // special treatment for block-level isolated-nodes
  let parent = node.getParent()
  if (node.isTextNode() && parent.is('.se-slug')) {
    let boundary = parent
    let isolatedNodeEl = boundary.getParent()
    let nodeId = isolatedNodeEl.getAttribute('data-id')
    if (nodeId) {
      var charPos = boundary.is('sm-after') ? 1 : 0
      return new Coordinate([nodeId], charPos)
    } else {
      console.error('FIXME: expecting a data-id attribute on IsolatedNodeComponent')
    }
  }
  return null
}

IsolatedNodeComponent.getDOMCoordinate = function(comp, coor) {
  let domCoor
  if (coor.offset === 0) {
    domCoor = {
      container: comp.refs.before.getNativeElement(),
      offset: 0
    }
  } else {
    domCoor = {
      container: comp.refs.after.getNativeElement(),
      offset: 1
    }
  }
  return domCoor
}

IsolatedNodeComponent.getDOMCoordinates = function(comp) {
  return {
    start: {
      container: comp.refs.before.getNativeElement(),
      offset: 0
    },
    end: {
      container: comp.refs.after.getNativeElement(),
      offset: 1
    }
  }
}

export default IsolatedNodeComponent
