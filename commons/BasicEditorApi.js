import { documentHelpers } from '../model'

export default class BasicEditorApi {
  constructor (archive, editorSession) {
    this.archive = archive
    this.editorSession = editorSession
  }

  getDocument () {
    return this.editorSession.getDocument()
  }

  deleteNode (nodeId) {
    this.editorSession.transaction(tx => {
      documentHelpers.deepDeleteNode(tx, nodeId)
    })
  }

  updateNode (id, nodeData) {
    this.editorSession.transaction(tx => {
      const node = tx.get(id)
      node.assign(nodeData)
    })
  }

  insertAnnotation (type, nodeData) {
    this.editorSession.transaction(tx => {
      tx.annotate(Object.assign({ type }, nodeData))
    })
  }
}
