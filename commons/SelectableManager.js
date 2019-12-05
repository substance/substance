export default class CustomSelectionManager {
  constructor (editorState) {
    this.editorState = editorState

    this._selectables = new Map()
    this._currentSelectable = null

    editorState.addObserver(['selection'], this._onSelectionChange, this, { stage: 'post-render' })
  }

  dispose () {
    this.editorState.removeObserver(this)
  }

  registerSelectable (id, selectable) {
    const _selectable = this._selectables.get(id)
    if (_selectable && _selectable !== selectable) {
      throw new Error(`A selectable has already been registered with '${id}'`)
    }
    this._selectables.set(id, selectable)
  }

  unregisterSelectable (id, selectable) {
    const _selectable = this._selectables.get(id)
    if (_selectable && _selectable !== selectable) {
      throw new Error(`selectable has not been registered with '${id}'`)
    }
    this._selectables.delete(id)
  }

  _onSelectionChange () {
    const sel = this.editorState.selection
    const oldSelectable = this._currentSelectable
    let newSelectable = null
    if (sel) {
      if (sel.isCustomSelection()) {
        if (sel.customType === 'value') {
          newSelectable = this._selectables.get(`${sel.nodeId}.${sel.data.property}#${sel.data.valueId}`)
        } else {
          newSelectable = this._selectables.get(sel.nodeId)
        }
      } else if (sel.isNodeSelection()) {
        newSelectable = this._selectables.get(sel.nodeId)
      }
    }
    if (oldSelectable) {
      oldSelectable.setSelected(false)
    }
    if (newSelectable) {
      newSelectable.setSelected(true)
    }
    this._currentSelectable = newSelectable
  }
}
