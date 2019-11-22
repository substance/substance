import { Component } from '../dom'

export default class SelectableNodeComponent extends Component {
  getInitialState () {
    const editorState = this.context.editorState
    const selectionState = editorState.selectionState
    const selected = (selectionState.node && selectionState.node.id === this.props.node.id)
    return { selected }
  }

  didMount () {
    const editorState = this.context.editorState
    if (editorState) {
      editorState.addObserver(['selectionState'], this._onSelectionChange, this, { stage: 'update' })
      editorState.addObserver(['selection', 'document'], this._rerenderIfSelectionChanged, this, {
        document: { path: [this.props.node.id] },
        stage: 'render'
      })
    }
  }

  dispose () {
    const editorState = this.context.editorState
    if (editorState) {
      editorState.removeObserver(this)
    }
  }

  _onSelectionChange (selectionState) {
    const sel = selectionState.selection
    // NOTE: selectionState.node is also set for property selections
    // but we are only interested in custom selections
    const selectedNode = (sel && sel.isCustomSelection()) ? selectionState.node : null
    if (this.state.selected) {
      if (!selectedNode || selectedNode !== this.props.node) {
        this._newSelectionState = { selected: false }
      }
    } else {
      if (selectedNode === this.props.node) {
        this._newSelectionState = { selected: true }
      }
    }
  }

  _rerenderIfSelectionChanged () {
    if (this._newSelectionState) {
      this.extendState(this._newSelectionState)
      this._newSelectionState = null
    } else if (this.context.editorState.isDirty('document')) {
      this.rerender()
    }
  }
}
