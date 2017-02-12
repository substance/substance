import forEach from '../util/forEach'

/*
  Each time a resource node is created an automatic fetch is triggered. This
  happens only once. We may want to adapt other fetching strategies as well.

  TODO: Resources would be problematic in a realtime scenario atm, as all
  collaborators would trigger a fetch of the resource, when it should only
  be done by the user who created the resource explicitly
*/

class ResourceManager {
  constructor(editorSession, context) {
    this.editorSession = editorSession
    this.context = context
    this.editorSession.onRender('document', this._onDocumentChange, this)
  }

  _onDocumentChange(change) {
    let doc = this.editorSession.getDocument()
    forEach(change.created, (node) => {
      node = doc.get(node.id)
      if (node.constructor.isResource) {
        setTimeout(() => {
          this.triggerFetch(node)
        })
      }
    })
  }

  /*
    Trigger fetch of a given resource
  */
  triggerFetch(resource) {
    resource.fetchPayload(this.context, (err, props) => {
      if (err) {
        this._updateNode(resource.id, {
          errorMessage: err.toString()
        })
      } else {
        this._updateNode(resource.id, props)
      }
    })
  }

  /*
      Fill in node payload
  */
  _updateNode(nodeId, props) {
    let editorSession = this.editorSession
    editorSession.transaction((tx) => {
      forEach(props, (val, key) => {
        tx.set([nodeId, key], val)
      })
    })
  }
}


export default ResourceManager
