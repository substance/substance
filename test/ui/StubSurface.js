import Surface from '../../packages/surface/Surface'
import EditorSession from '../../model/EditorSession'
import Configurator from '../../util/Configurator'

function StubSurface(doc, containerId) {

  this.name = 'test_surface'
  this.containerId = containerId
  this.editorSession = new EditorSession(doc, { configurator: new Configurator() })

  this.getName = function() {
    return this.name
  }

  this.getId = function() {
    return this.name
  }

  this.getDocument = function() {
    return doc
  }

  this.getEditorSession = function() {
    return this.editorSession
  }

  this.getSelection = function() {
    return this.editorSession.getSelection()
  }

  this.setSelection = function(sel) {
    this._setSelection(sel)
  }

  this._setSelection = function(sel) {
    this.editorSession.setSelection(sel)
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
