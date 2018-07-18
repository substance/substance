/*
  An EditorSession provides access to the state of an editor
  for a single document, and provides means to manipulate the underlying document.

  The EditorSession may be part of a complex application bound to a scope
  containing only state variables for a single editor.
*/
export default class AbstractEditorSession {
  getDocument () {
    throw new Error('This method is abstract')
  }

  /**
   * @return {Selection} the current document selection
   */
  getSelection () {
    throw new Error('This method is abstract')
  }

  /**
   *  Change the editor's selection.
   */
  setSelection (sel) { // eslint-disable-line no-unused
    throw new Error('This method is abstract')
  }

  /**
   *  Details about current selection that are derived from the current
   *  selection and document.
   */
  getSelectionState () {
    throw new Error('This method is abstract')
  }

  /**
    Manipulate the underlying document yielding a DocumentChange

    @return {DocumentChange}
  */
  transaction (transformation, info) { // eslint-disable-line no-unused
    throw new Error('This method is abstract')
  }

  /**
    @return true if this editor is blurred
  */
  isBlurred () {
    throw new Error('This method is abstract')
  }

  getFocusedSurface () {
    throw new Error('This method is abstract')
  }
}
