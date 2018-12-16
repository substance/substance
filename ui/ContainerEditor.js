import isArray from '../util/isArray'
import isArrayEqual from '../util/isArrayEqual'
import keys from '../util/keys'
import * as selectionHelpers from '../model/selectionHelpers'
import Surface from './Surface'
import RenderingEngine from './RenderingEngine'
import { getContainerPosition } from '../model/documentHelpers'

/**
 * Represents an editor for content rendered in a flow, such as a manuscript.
 *
 * @prop {String} name unique editor name
 * @prop {String} containerPath container id
 *
 * @example
 *
 * Create a full-fledged `ContainerEditor` for the `body` container of a document.
 * Allow Strong and Emphasis annotations and to switch text types between paragraph
 * and heading at level 1.
 *
 * ```js
 * $$(ContainerEditor, {
 *   name: 'bodyEditor',
 *   containerPath: ['body', 'nodes']
 * })
 * ```
 */
export default class ContainerEditor extends Surface {
  constructor (parent, props, el) {
    // TODO consolidate this - how is it used actually?
    props.containerPath = props.containerPath || props.node.getContentPath()
    props.name = props.name || props.containerPath.join('.') || props.node.id

    super(parent, props, el)

    this.containerPath = this.props.containerPath
    if (!isArray(this.containerPath)) {
      throw new Error("Property 'containerPath' is mandatory.")
    }

    this._deriveInternalState(this.props)
  }

  // Note: this component is self managed
  shouldRerender (newProps) {
    if (newProps.disabled !== this.props.disabled) return true
    // TODO: we should still detect when the document has changed,
    // see https://github.com/substance/substance/issues/543
    return false
  }

  willReceiveProps (newProps) {
    super.willReceiveProps.apply(this, arguments)
    this._deriveInternalState(newProps)
  }

  didMount () {
    super.didMount.apply(this, arguments)
    let editorSession = this.getEditorSession()
    editorSession.onUpdate('document', this._onContainerChanged, this, {
      path: this.getContainerPath()
    })
    this._attachPlaceholder()
  }

  dispose () {
    super.dispose.apply(this, arguments)
    let editorSession = this.getEditorSession()
    editorSession.off(this)
  }

  render ($$) {
    let el = super.render($$)

    let doc = this.getDocument()
    let containerPath = this.getContainerPath()
    el.addClass('sc-container-editor container-node')
      .attr('data-id', containerPath.join('.'))

    // native spellcheck
    el.attr('spellcheck', this.props.spellcheck === 'native')

    let ids = doc.get(containerPath)
    el.append(
      ids.map((id, index) => {
        return this._renderNode($$, doc.get(id), index)
      })
    )

    // No editing if disabled by user or container is empty
    if (!this.props.disabled && !this.isEmpty()) {
      el.addClass('sm-enabled')
      el.setAttribute('contenteditable', true)
    }

    return el
  }

  selectFirst () {
    let doc = this.getDocument()
    let containerPath = this.getContainerPath()
    let nodeIds = doc.get()
    if (nodeIds.length > 0) {
      const editorSession = this.getEditorSession()
      const first = doc.get(nodeIds[0])
      selectionHelpers.setCursor(editorSession, first, containerPath, 'before')
    }
  }

  _renderNode ($$, node, nodeIndex) {
    if (!node) throw new Error('Illegal argument')
    let ComponentClass = this._getNodeComponentClass(node)
    let props = this._getNodeProps(node)
    return $$(ComponentClass, props).ref(node.id)
  }

  _getNodeComponentClass (node) {
    let ComponentClass = this.getComponent(node.type)
    if (node.isText() || ComponentClass.prototype._isCustomNodeComponent || ComponentClass.prototype._isIsolatedNodeComponent) {
      return ComponentClass
    } else {
      return this.getComponent('isolated-node')
    }
  }

  _deriveInternalState (props) {
    let _state = this._state
    if (!props.hasOwnProperty('enabled') || props.enabled) {
      _state.enabled = true
    } else {
      _state.enabled = false
    }
  }

  _selectNextIsolatedNode (direction) {
    let selState = this.getEditorSession().getSelectionState()
    let node = (direction === 'left') ? selState.previousNode : selState.nextNode
    let isIsolatedNode = !node.isText() && !node.isList()
    if (!node || !isIsolatedNode) return false
    if (
      (direction === 'left' && selState.isFirst) ||
      (direction === 'right' && selState.isLast)
    ) {
      this.getEditorSession().setSelection({
        type: 'node',
        nodeId: node.id,
        containerPath: this.getContainerPath(),
        surfaceId: this.id
      })
      return true
    }
    return false
  }

  _handleLeftOrRightArrowKey (event) {
    event.stopPropagation()
    const doc = this.getDocument()
    const sel = this.getEditorSession().getSelection()
    const left = (event.keyCode === keys.LEFT)
    const right = !left
    const direction = left ? 'left' : 'right'

    if (sel && !sel.isNull()) {
      let containerPath = sel.containerPath
      // Don't react if we are at the boundary of the document
      if (sel.isNodeSelection()) {
        let nodeIds = doc.get(containerPath)
        let nodePos = getContainerPosition(doc, sel.getNodeId())
        if ((left && nodePos === 0) || (right && nodePos === nodeIds.length - 1)) {
          event.preventDefault()
          return
        }
      }
      if (sel.isNodeSelection() && !event.shiftKey) {
        this.domSelection.collapse(direction)
      }
    }

    this._delayed(() => {
      this._updateModelSelection({ direction })
    })
  }

  _handleUpOrDownArrowKey (event) {
    event.stopPropagation()
    const doc = this.getDocument()
    const sel = this.getEditorSession().getSelection()
    const up = (event.keyCode === keys.UP)
    const down = !up
    const direction = up ? 'left' : 'right'

    if (sel && !sel.isNull()) {
      let containerPath = sel.containerPath
      // Don't react if we are at the boundary of the document
      if (sel.isNodeSelection()) {
        let nodeIds = doc.get(containerPath)
        let nodePos = getContainerPosition(doc, sel.getNodeId())
        if ((up && nodePos === 0) || (down && nodePos === nodeIds.length - 1)) {
          event.preventDefault()
          return
        }
        // Unfortunately we need to navigate out of an isolated node
        // manually, as even Chrome on Win is not able to do it.
        let editorSession = this.getEditorSession()
        // TODO the following fixes the mentioned problem for
        // regular UP/DOWN (non expanding)
        // For SHIFT+DOWN it happens to work, and only SHIFT-UP when started as NodeSelection needs to be fixed
        if (!event.shiftKey) {
          event.preventDefault()
          if (up) {
            let prev = doc.get(nodeIds[nodePos - 1])
            selectionHelpers.setCursor(editorSession, prev, containerPath, 'after')
            return
          } else {
            let next = doc.get(nodeIds[nodePos + 1])
            selectionHelpers.setCursor(editorSession, next, containerPath, 'before')
            return
          }
        }
      }
    }

    this._delayed(() => {
      this._updateModelSelection({ direction })
    })
  }

  _handleTabKey (event) {
    const editorSession = this.getEditorSession()
    const sel = editorSession.getSelection()
    // EXPERIMENTAL: using TAB to enter an isolated node
    if (sel.isNodeSelection() && sel.isFull()) {
      const comp = this.refs[sel.getNodeId()]
      if (comp && selectionHelpers.stepIntoIsolatedNode(editorSession, comp)) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
    }
    super._handleTabKey(event)
  }

  __handleTab (e) {
    e.preventDefault()
    if (e.shiftKey) {
      this.getEditorSession().transaction((tx) => {
        tx.dedent()
      }, { action: 'dedent' })
    } else {
      this.getEditorSession().transaction((tx) => {
        tx.indent()
      }, { action: 'indent' })
    }
  }

  // Used by Clipboard
  isContainerEditor () {
    return true
  }

  /**
    Returns the containerPath the editor is bound to
  */
  getContainerPath () {
    return this.containerPath
  }

  isEmpty () {
    let ids = this.getDocument().get(this.containerPath)
    return (!ids || ids.length === 0)
  }

  /*
    Adds a placeholder if needed
  */
  _attachPlaceholder () {
    let firstNode = this.childNodes[0]
    // Remove old placeholder if necessary
    if (this.placeholderNode) {
      this.placeholderNode.extendProps({
        placeholder: undefined
      })
    }

    if (this.childNodes.length === 1 && this.props.placeholder) {
      firstNode.extendProps({
        placeholder: this.props.placeholder
      })
      this.placeholderNode = firstNode
    }
  }

  isEditable () {
    return super.isEditable.call(this) && !this.isEmpty()
  }

  // called by flow when subscribed resources have been updated
  _onContainerChanged (change) {
    let doc = this.getDocument()
    // first update the container
    let renderContext = RenderingEngine.createContext(this)
    let $$ = renderContext.$$
    let containerPath = this.getContainerPath()
    for (let i = 0; i < change.ops.length; i++) {
      let op = change.ops[i]
      if (op.type === 'update' && isArrayEqual(op.path, containerPath)) {
        let diff = op.diff
        if (diff.type === 'insert') {
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
        } else if (diff.type === 'delete') {
          this.removeAt(diff.getOffset())
        }
      }
    }
    this._attachPlaceholder()
  }

  get _isContainerEditor () { return true }
}
