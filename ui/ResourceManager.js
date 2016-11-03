import inBrowser from '../util/inBrowser'
import DocumentIndex from '../model/DocumentIndex'

class ResourceManager {
  constructor(editorSession, context) {
    this.editorSession = editorSession
    this.context = context

    this.editorSession.getDocument().addIndex('resources', new ResourceIndex(this))
  }

  triggerFetch(resource) {
    resource.fetchPayload(this.context, function(err, result) {
      console.log('do stuff')
    })
  }
}


class ResourceIndex extends DocumentIndex {

  constructor(resourceManager) {
    super()

    this.resourceManager = resourceManager
  }

  select(node) {
    return Boolean(node.constructor.isResource)
  }

  reset(data) {
    this.resources = {}
    this._initialize(data)
  }

  get() {
    return this.resources
  }

  create(resource) {
    this.resources[resource.id] = resource
    this.resourceManager.triggerFetch(resource)
  }

  delete(resource) {
    delete this.resources[resource.id]
  }

}


export default ResourceManager
