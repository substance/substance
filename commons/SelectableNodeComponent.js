import { Component } from '../dom'

export default class SelectableNodeComponent extends Component {
  getInitialState () {
    const editorState = this.context.editorState
    const selectionState = editorState.selectionState
    const selected = this._isSelected(selectionState)
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
    const isSelected = this._isSelected(selectionState)
    if (this.state.selected) {
      if (!isSelected) {
        this._newSelectionState = { selected: false }
      }
    } else {
      if (isSelected) {
        this._newSelectionState = { selected: true }
      }
    }
  }

  _isSelected (selectionState) {
    const sel = selectionState.selection
    return (
      sel &&
      sel.isCustomSelection() &&
      sel.customType === 'node' &&
      sel.nodeId === this.props.node.id
    )
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
