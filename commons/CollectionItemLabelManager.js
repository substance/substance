export default class CollectionItemLabelManager {
  constructor (editorSession) {
    this.editorSession = editorSession

    const path = this.getPath()
    this.editorSession.getEditorState().addObserver(['document'], this._onChange, this, {
      stage: 'update',
      document: {
        path
      }
    })
  }

  dispose () {
    this.editorSession.getEditorState().removeObserver(this)
  }

  getPath () {
    throw new Error('Not implemented.')
  }

  /**
   * @param {*} item
   *
   * @example
   * ```
   *   // simple counter
   *   String(item.getPosition() + 1)
   *   // other counters
   *   LATIN_LETTERS_UPPER_CASE.charAt(item.getPosition())
   *   // template string
   *   `Figure ${item.getPosition() + 1}`
   * ```
   */
  getItemLabel (item) {
    throw new Error('Not implemented.')
  }

  update () {
    const doc = this.editorSession.getDocument()
    const path = this.getPath()
    const items = doc.resolve(path, true)
    const stateUpdates = items.map(item => {
      const label = this.getItemLabel(item)
      return [item.id, { label }]
    })
    this.editorSession.updateNodeStates(stateUpdates, { silent: true })
  }

  _onChange () {
    this.update()
  }
}
