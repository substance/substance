import ApiExtension from './ApiExtension'

export default class ReferenceApi extends ApiExtension {
  /**
   * @param {object} data from ReferenceModal state
   */
  addReference (data) {
    this.insertReference(data)
  }

  /**
   * @param {object} data from ReferenceModal state
   * @param {object} currentReference
   */
  insertReference (data, currentReference) {
    const editorSession = this.api.getEditorSession()
    const doc = editorSession.getDocument()
    const root = doc.root
    let insertPos = root.references.length
    if (currentReference) {
      insertPos = currentReference.getPosition() + 1
    }
    const nodeData = Object.assign({}, data, { type: 'reference' })
    this.api.insertNode([root.id, 'references'], insertPos, nodeData)
  }
}
