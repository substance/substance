import isString from '../util/isString'
import keys from '../util/keys'
import platform from '../util/platform'
import EditingBehavior from '../model/EditingBehavior'
import Surface from '../packages/surface/Surface'
import RenderingEngine from './RenderingEngine'
import IsolatedNodeComponent from '../packages/isolated-node/IsolatedNodeComponent'

/**
  Represents a flow editor that manages a sequence of nodes in a container. Needs to be
  instantiated inside a {@link ui/Controller} context.

  @class ContainerEditor
  @component
  @extends ui/Surface

  @prop {String} name unique editor name
  @prop {String} containerId container id
  @prop {Object[]} textTypes array of textType definition objects
  @prop {ui/SurfaceCommand[]} commands array of command classes to be available

  @example

  Create a full-fledged `ContainerEditor` for the `body` container of a document.
  Allow Strong and Emphasis annotations and to switch text types between paragraph
  and heading at level 1.

  ```js
  $$(ContainerEditor, {
    name: 'bodyEditor',
    containerId: 'body',
    textTypes: [
      {name: 'paragraph', data: {type: 'paragraph'}},
      {name: 'heading1',  data: {type: 'heading', level: 1}}
    ],
    commands: [StrongCommand, EmphasisCommand, SwitchTextTypeCommand],
  })
  ```
*/

class ContainerEditor extends Surface {

  constructor(parent, props, el) {
    // default props derived from the given props
    props.containerId = props.containerId || props.node.id
    props.name = props.name || props.containerId || props.node.id

    super(parent, props, el)

    this.containerId = this.props.containerId
    if (!isString(this.containerId)) {
      throw new Error("Property 'containerId' is mandatory.")
    }
    let doc = this.getDocument()
    this.container = doc.get(this.containerId)
    if (!this.container) {
      throw new Error('Container with id ' + this.containerId + ' does not exist.')
    }

    this.textTypes = this.props.textTypes || []

    this.editingBehavior = this.context.editingBehavior || new EditingBehavior()

    this._deriveInternalState(this.props)
  }

  // Note: this component is self managed
  shouldRerender(newProps) {
    if (newProps.disabled !== this.props.disabled) return true
    // TODO: we should still detect when the document has changed,
    // see https://github.com/substance/substance/issues/543
    return false
  }

  willReceiveProps(newProps) {
    super.willReceiveProps.apply(this, arguments)
    this._deriveInternalState(newProps)
  }

  didMount() {
    super.didMount.apply(this, arguments)
    let editorSession = this.getEditorSession()
    editorSession.onUpdate('document', this._onContainerChanged, this, {
      path: [this.getContainerId(), 'nodes']
    })

  }

  dispose() {
    super.dispose.apply(this, arguments)
    let editorSession = this.getEditorSession()
    editorSession.off(this)
  }

  render($$) {
    let el = super.render($$)

    let doc = this.getDocument()
    let containerId = this.getContainerId()
    let containerNode = doc.get(containerId)
    if (!containerNode) {
      console.warn('No container node found for ', containerId)
    }
    el.addClass('sc-container-editor container-node ' + containerId)
      .attr("data-id", containerId)

    // native spellcheck
    el.attr('spellcheck', this.props.spellcheck === 'native')

    containerNode.getNodes().forEach(function(node) {
      el.append(this._renderNode($$, node))
    }.bind(this))

    // No editing if disabled by user or container is empty
    if (!this.props.disabled && !this.isEmpty()) {
      el.addClass('sm-enabled')
      el.setAttribute('contenteditable', true)
    }

    return el
  }


  _renderNode($$, node) {
    if (!node) throw new Error('Illegal argument')
    if (node.isText()) {
      return super.renderNode($$, node)
    } else {
      let componentRegistry = this.context.componentRegistry
      let ComponentClass = componentRegistry.get(node.type)
      if (ComponentClass.prototype._isCustomNodeComponent || ComponentClass.prototype._isIsolatedNodeComponent) {
        return $$(ComponentClass, { node: node }).ref(node.id)
      } else {
        return $$(IsolatedNodeComponent, { node: node }).ref(node.id)
      }
    }
  }

  _deriveInternalState(props) {
    let _state = this._state
    if (!props.hasOwnProperty('enabled') || props.enabled) {
      _state.enabled = true
    } else {
      _state.enabled = false
    }
  }

  _handleUpOrDownArrowKey(event) {
    event.stopPropagation()
    let direction = (event.keyCode === keys.UP) ? 'left' : 'right'
    let selState = this.getEditorSession().getSelectionState()
    let sel = selState.getSelection()

    // Note: this collapses the selection, just to let ContentEditable continue doing a cursor move
    if (sel.isNodeSelection() && sel.isFull() && !event.shiftKey) {
      this.domSelection.collapse(direction)
    }
    // HACK: ATM we have a cursor behavior in Chrome and FF when collapsing a selection
    // e.g. have a selection from up-to-down and the press up, seems to move the focus
    else if (!platform.isIE && !sel.isCollapsed() && !event.shiftKey) {
      this._setSelection(sel.collapse(direction))
    } else if (sel.isCollapsed() && event.altKey) {
      let container = this.getContainer()
      let nodePos = container.getPosition(sel.getNodeId())
      if (event.keyCode === keys.UP && nodePos > 0) {
        let prev = container.getNodeAt(nodePos-1)
        if (!prev.isText() && !prev.isList()) {
          this.getEditorSession().setSelection({
            type: 'node',
            nodeId: prev.id,
            mode: 'full',
            containerId: container.id,
            surfaceId: this.id
          })
          return
        }
      } else if (event.keyCode === keys.DOWN && nodePos < container.getLength()) {
        let next = container.getNodeAt(nodePos+1)
        if (!next.isText() && !next.isList()) {
          this.getEditorSession().setSelection({
            type: 'node',
            nodeId: next.id,
            mode: 'full',
            containerId: container.id,
            surfaceId: this.id
          })
          return
        }
      }
    }
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we try to map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return
      this._updateModelSelection({ direction: direction })
    }.bind(this))
  }

  _handleLeftOrRightArrowKey(event) {
    event.stopPropagation()
    let direction = (event.keyCode === keys.LEFT) ? 'left' : 'right'
    let selState = this.getEditorSession().getSelectionState()
    let sel = selState.getSelection()
    if (sel.isNodeSelection() && sel.isFull() && !event.shiftKey) {
      this._setSelection(sel.collapse(direction))
    } else {
      super._handleLeftOrRightArrowKey.call(this, event)
    }
  }

  _handleEnterKey(event) {
    let sel = this.getEditorSession().getSelection()
    if (sel.isNodeSelection() && sel.isFull()) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      super._handleEnterKey.apply(this, arguments)
    }
  }

  // Used by Clipboard
  isContainerEditor() {
    return true
  }

  /**
    Returns the containerId the editor is bound to
  */
  getContainerId() {
    return this.containerId
  }

  // TODO: do we really need this in addition to getContainerId?
  getContainer() {
    return this.getDocument().get(this.getContainerId())
  }

  isEmpty() {
    let containerNode = this.getContainer()
    return (containerNode && containerNode.nodes.length === 0)
  }

  isEditable() {
    return super.isEditable.call(this) && !this.isEmpty()
  }

  getTextTypes() {
    return this.textTypes || []
  }

  // Used by SwitchTextTypeTool
  // TODO: Filter by enabled commands for this Surface
  // TODO: rethink
  getTextCommands() {
    var textCommands = {}
    this.commandRegistry.each(function(cmd) {
      if (cmd.constructor.textTypeName) {
        textCommands[cmd.getName()] = cmd
      }
    });
    return textCommands
  }

  // called by flow when subscribed resources have been updated
  _onContainerChanged(change) {
    let doc = this.getDocument()
    // first update the container
    let renderContext = RenderingEngine.createContext(this)
    let $$ = renderContext.$$
    let container = this.getContainer()
    let path = container.getContentPath()
    for (let i = 0; i < change.ops.length; i++) {
      let op = change.ops[i]
      if (op.type === "update" && op.path[0] === path[0]) {
        let diff = op.diff
        if (diff.type === "insert") {
          let nodeId = diff.getValue()
          let node = doc.get(nodeId)
          let nodeEl
          if (node) {
            nodeEl = this._renderNode($$, node)
          } else {
            // node does not exist anymore
            // so we insert a stub element, so that the number of child
            // elements is consistent
            nodeEl = $$('div')
          }
          this.insertAt(diff.getOffset(), nodeEl)
        } else if (diff.type === "delete") {
          this.removeAt(diff.getOffset())
        }
      }
    }
  }
}

ContainerEditor.prototype._isContainerEditor = true

export default ContainerEditor
