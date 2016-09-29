import Surface from '../../packages/surface/Surface'
import DocumentSession from '../../model/DocumentSession'

function StubSurface(doc, containerId) {

  this.name = 'test_surface'
  this.containerId = containerId
  this.documentSession = new DocumentSession(doc)

  this.getName = function() {
    return this.name
  }

  this.getId = function() {
    return this.name
  }

  this.getDocument = function() {
    return doc
  }

  this.getDocumentSession = function() {
    return this.documentSession
  }

  this.getSelection = function() {
    return this.documentSession.getSelection()
  }

  this.setSelection = function(sel) {
    this._setSelection(sel)
  }

  this._setSelection = function(sel) {
    this.documentSession.setSelection(sel)
  }

  this.getContainerId = function() {
    return this.containerId
  }

  this.isContainerEditor = function() {
    return Boolean(this.containerId)
  }

  this.emit = function() {}

  this.rerenderDOMSelection = function() {}

  this.transaction = Surface.prototype.transaction

  this.copy = Surface.prototype.copy

  this._prepareArgs = function() {}
}

export default StubSurface
