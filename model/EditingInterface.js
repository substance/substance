import isPlainObject from '../util/isPlainObject'
import copySelection from './copySelection'
import Editing from './Editing'
import Selection from './Selection'
import { augmentSelection } from './selectionHelpers'

/*
  Abstract base class for document editor APIs such as Transaction.

  It implements a turtle-graphics way of editing by maintaining a selection state
  and providing an interface for low- and high-level manipulation.

  Low-level manipulations are dispatched to the edited document instance.
  Higher-level manipulations involve complex manipulations keeping the selection in a correct state.
 */
export default class EditingInterface {
  constructor (doc, options = {}) {
    this._document = doc
    this._selection = null
    this._impl = options.editing || new Editing()
    this._direction = null
  }

  dispose () {}

  getDocument () {
    return this._document
  }

  /* low-level API */

  get (...args) {
    return this._document.get(...args)
  }

  getProperty (...args) {
    return this._document.getProperty(...args)
  }

  contains (id) {
    return this._document.contains(id)
  }

  create (nodeData) {
    return this._document.create(nodeData)
  }

  createDefaultTextNode (content) {
    return this._document.createDefaultTextNode(content, this._direction)
  }

  delete (nodeId) {
    return this._document.delete(nodeId)
  }

  set (path, value) {
    return this._document.set(path, value)
  }

  update (path, diffOp) {
    return this._document.update(path, diffOp)
  }

  updateNode (id, newProps) {
    return this._document.updateNode(id, newProps)
  }

  /* Selection API */

  createSelection (selData) {
    // TODO: we need to rethink this
    // I'd like to make it convenient for the 99% use cases
    // which means reusing containerId and surfaceId
    // However, it does not work well for cases
    // where the surface changes
    // Even better would be just to have surfaceId, and derive
    // containerId dynamically
    selData = augmentSelection(selData, this._selection)
    return this._document.createSelection(selData)
  }

  setSelection (sel) {
    if (!sel) {
      sel = Selection.nullSelection
    } else if (isPlainObject(sel)) {
      sel = this.createSelection(sel)
    } else if (!sel.isNull()) {
      sel = augmentSelection(sel, this._selection)
    }
    this._selection = sel
    return sel
  }

  getSelection () {
    return this._selection
  }

  get selection () {
    return this._selection
  }

  set selection (sel) {
    this.setSelection(sel)
  }

  /*
    ATTENTION/TODO: text direction could be different on different paragraphs
    I.e. it should probably be a TextNode property
  */
  get textDirection () {
    return this._direction
  }

  set textDirection (dir) {
    this._direction = dir
  }

  /* High-level editing */

  annotate (annotationData) {
    const sel = this._selection
    if (sel && (sel.isPropertySelection() || sel.isContainerSelection())) {
      return this._impl.annotate(this, annotationData)
    }
  }

  break () {
    if (this._selection && !this._selection.isNull()) {
      this._impl.break(this)
    }
  }

  copySelection () {
    const sel = this._selection
    if (sel && !sel.isNull() && !sel.isCollapsed()) {
      return copySelection(this.getDocument(), this._selection)
    }
  }

  deleteSelection (options) {
    const sel = this._selection
    if (sel && !sel.isNull() && !sel.isCollapsed()) {
      this._impl.delete(this, 'right', options)
    }
  }

  deleteCharacter (direction) {
    const sel = this._selection
    if (!sel || sel.isNull()) {
      // nothing
    } else if (!sel.isCollapsed()) {
      this.deleteSelection()
    } else {
      this._impl.delete(this, direction)
    }
  }

  insertText (text) {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      this._impl.insertText(this, text)
    }
  }

  // insert an inline node with given data at the current selection
  insertInlineNode (inlineNode) {
    const sel = this._selection
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      return this._impl.insertInlineNode(this, inlineNode)
    }
  }

  insertBlockNode (blockNode) {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.insertBlockNode(this, blockNode)
    }
  }

  paste (content) {
    const sel = this._selection
    if (sel && !sel.isNull() && !sel.isCustomSelection()) {
      return this._impl.paste(this, content)
    }
  }

  switchTextType (nodeData) {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.switchTextType(this, nodeData)
    }
  }

  toggleList (params) {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.toggleList(this, params)
    }
  }

  indent () {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.indent(this)
    }
  }

  dedent () {
    const sel = this._selection
    if (sel && !sel.isNull()) {
      return this._impl.dedent(this)
    }
  }

  /* Legacy low-level API */

  getIndex (...args) {
    return this._document.getIndex(...args)
  }

  getAnnotations (...args) {
    return this._document.getAnnotations(...args)
  }

  getSchema () {
    return this._document.getSchema()
  }

  createSnippet () {
    return this._document.createSnippet()
  }
}
