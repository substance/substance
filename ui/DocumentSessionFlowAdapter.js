/*
  Thist Flow adapter listens to document session updates and
  feeds resources into the flow:

  - `[<doc-id>, 'change']`: the DocumentChange instance useful for low-level stuff as done by ContainerEditor
  - `[<doc-id>, <node-id>, <property-name>]`: the changed value of a property
  - `[<doc-id>, <node-id>]`: a node's data when created or deleted
  - `[<doc-id>, 'selection']`: changed selection
  - `[<doc-id>, 'collaborators']: changed collaborators

  Most often the resource for properties updates will be subscribed to.

  ```js
  flow.subscribe({
    stage: 'render',
    resources: [[doc.id].concat(propertyPath)],
    handler: this._onPropertyUpdate,
    owner: this
  })
  ```
*/
class DocumentSessionFlowAdapter {

  constructor(flow, documentSession) {
    this.flow = flow
    this.documentSession = documentSession
    this.doc = documentSession.getDocument()

    // register this adpater so that it will be disposed later
    flow.registerAdapter(this)
    documentSession.on('update', this._onSessionUpdate, this)
  }

  dispose() {
    const documentSession = this.documentSession
    documentSession.off(this)
  }

  _onSessionUpdate(update, info) {
    const change = update.change
    const selection = update.selection
    const collaborators = update.collaborators
    const doc = this.documentSession.getDocument()
    const flow = this.flow

    flow.extendInfo(info)
    if (change) {
      flow.set([doc.id, 'change'], change)
      Object.keys(change.created).forEach((id) => {
        flow.set([doc.id, id], change.created[id])
      })
      Object.keys(change.updated).forEach((id) => {
        // do we really want to retrieve the data each time?
        flow.set([doc.id, id], doc.get(id.split(',')))
      })
      Object.keys(change.deleted).forEach((id) => {
        flow.set([doc.id, id], change.deleted[id])
      })
    }
    if (selection) {
      flow.set([doc.id, 'selection'], selection)
    }
    if (collaborators) {
      flow.set([doc.id, 'collaborators'], collaborators)
    }
    // if not yet running this triggers it
    flow.start()
  }
}

DocumentSessionFlowAdapter.connect = function(flow, documentSession) {
  new DocumentSessionFlowAdapter(flow, documentSession)
}

export default DocumentSessionFlowAdapter

