import isPlainObject from '../util/isPlainObject'
import copySelection from '../model/copySelection'
import Editing from '../model/Editing'
import Selection from '../model/Selection'

/*
  Abstract base class for document editor APIs such as Transaction.

  It implements a turtle-graphics way of editing by maintaining a selection state
  and providing an interface for low- and high-level manipulation.

  Low-level manipulations are dispatched to the edited document instance.
  Higher-level manipulations involve complex manipulations keeping the selection in a correct state.
 */
class EditingInterface {

  constructor(doc) {
    this._document = doc
    this._selection = null
    // TODO: allow for custom editing implementation
    this._impl = new Editing()
    this._direction = null
  }

  getDocument() {
    return this._document
  }

  /* low-level API */

  get(...args) {
    return this._document.get(...args)
  }

  contains(id) {
    return this._document.contains(id)
  }

  create(nodeData) {
    return this._document.create(nodeData)
  }

  createDefaultTextNode(content) {
    return this._document.createDefaultTextNode(content, this._direction)
  }

  delete(nodeId) {
    return this._document.delete(nodeId)
  }

  set(path, value) {
    return this._document.set(path, value)
  }

  update(path, diffOp) {
    return this._document.update(path, diffOp)
  }

  /* Selection API */

  createSelection(selData) {
    // TODO: this is questionable
    // I'd like to convenience first for the 99% use cases
    // which means that I copy over containerId and surfaceId
    // if possible and not explicitly set
    const oldSel = this._selection
    if (selData && oldSel) {
      if (!selData.containerId && oldSel.containerId) {
        selData.containerId = oldSel.containerId
      }
      if (!selData.surfaceId && oldSel.surfaceId) {
        selData.surfaceId = oldSel.surfaceId
      }
    }
    return this._document.createSelection(selData)
  }

  setSelection(sel) {
    if (!sel) sel = Selection.nullSelection
    else if (isPlainObject(sel)) {
      sel = this.createSelection(sel)
    }
    let oldSel = this._selection
    if (oldSel && sel && !sel.isNull()) {
      if (!sel.containerId) {
        sel.containerId = oldSel.containerId
      }
    }
    this._selection = sel
  }

  getSelection() {
    return this._selection
  }

  get selection() {
    return this._selection
  }

  set selection(sel) {
    this.setSelection(sel)
  }

  /*
    ATTENTION/TODO: text direction could be different on different paragraphs
    I.e. it should probably be a TextNode property
  */
  get textDirection() {
    return this._direction
  }

  set textDirection(dir) {
    this._direction = dir
  }

  /* High-level editing */

  annotate(annotationData) {
    const sel = this._selection
    if (sel && (sel.isPropertySelection() || sel.isContainerSelection())) {
      return this._impl.annotate(this, annotationData)
    }
  }

  break() {
    if (this._selection && !this._selection.isNull()) {
      this._impl.break(this)
    }
  }

  copySelection() {
    const sel = this._selection
    if (sel && !sel.isNull() && !sel.isCollapsed()) {
      return copySelection(this.getDocument(), this._selection)
    }
  }

  deleteSelection(options) {
    const sel = this._selection
    if (sel && !sel.isNull() && !sel.isCollapsed()) {
      this._impl.delete(this, 'right', options)
    }
  }

  deleteCharacter(direction) {
    const sel = this._selection
    if (!sel || sel.isNull()) {
      // nothing
    } else if (!sel.isCollapsed()) {
      this.deleteSelection()
    } else {
      this._impl.delete(this, direction)
    }
  }

  insertText(text) {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      this._impl.insertText(this, text)
    }
  }

  // insert an inline node with given data at the current selection
  insertInlineNode(inlineNode) {
    const sel = this._selection
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      return this._impl.insertInlineNode(this, inlineNode)
    }
  }

  insertBlockNode(blockNode) {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.insertBlockNode(this, blockNode)
    }
  }

  paste(content) {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.paste(this, content)
    }
  }

  switchTextType(nodeData) {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.switchTextType(this, nodeData)
    }
  }

  toggleList(params) {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.toggleList(this, params)
    }
  }

  indent() {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.indent(this)
    }
  }

  dedent() {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.dedent(this)
    }
  }

  /* Legacy low-level API */

  getIndex(...args) {
    return this._document.getIndex(...args)
  }

  getAnnotations(...args) {
    return this._document.getAnnotations(...args)
  }

  getSchema() {
    return this._document.getSchema()
  }

  createSnippet() {
    return this._document.createSnippet()
  }

}

export default EditingInterface
