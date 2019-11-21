import { documentHelpers } from '../model'

export default class BasicEditorApi {
  constructor (archive, editorSession) {
    this.archive = archive
    this.editorSession = editorSession
  }

  getDocument () {
    return this.editorSession.getDocument()
  }

  getRoot () {
    return this.getDocument().root
  }

  deleteNode (nodeId) {
    this.editorSession.transaction(tx => {
      documentHelpers.deepDeleteNode(tx, nodeId)
    })
  }

  removeAndDeleteNode (nodeId) {
    const node = this.editorSession.getDocument().get(nodeId, true)
    const parent = node.getParent()
    if (parent) {
      const { property: propertyName, pos } = node.getXpath()
      const property = parent.schema.getProperty(propertyName)
      this.editorSession.transaction(tx => {
        if (property.isArray()) {
          documentHelpers.removeAt(tx, [parent.id, propertyName], pos)
        } else {
          tx.set([parent.id, propertyName], null)
        }
        documentHelpers.deepDeleteNode(tx, nodeId)
        tx.setSelection(null)
      })
    }
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

  moveNode (nodeId, direction) {
    const doc = this.getDocument()
    const node = doc.get(nodeId)
    const parent = node.getParent()
    if (!parent) throw new Error('Figure does not exist')
    const propertyName = node.getXpath().property
    const pos = node.getPosition()
    const diff = direction === 'up' ? -1 : +1
    this.editorSession.transaction(tx => {
      documentHelpers.removeAt(tx, [parent.id, propertyName], pos)
      documentHelpers.insertAt(tx, [parent.id, propertyName], pos + diff, node.id)
    })
  }

  addNode (collectionPath, nodeData) {
    this.editorSession.transaction(tx => {
      const node = tx.create(nodeData)
      documentHelpers.append(tx, collectionPath, node.id)
      this._selectItem(tx, node)
    })
  }

  selectItem (item) {
    this._selectItem(this.editorSession, item)
  }

  _selectItem (tx, node) {
    tx.setSelection({
      type: 'custom',
      nodeId: node.id,
      customType: node.type
    })
  }
}
