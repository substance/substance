import Configurator from '../../util/Configurator'
import FileClientStub from './FileClientStub'
import SaveHandlerStub from './SaveHandlerStub'
import DefaultToolbar from '../tools/Toolbar'

/*
  This works well for single-column apps (such as ProseEditor).
  Write your own Configurator for apps that require more complex
  configuration (e.g. when there are multiple surfaces involved
  each coming with different textTypes, enabled commands etc.)
*/
class ProseEditorConfigurator extends Configurator {
  constructor(...args) {
    super(...args)
    // Extend configuration
    this.config.saveHandler = new SaveHandlerStub()
    this.config.fileClient = new FileClientStub()
    this.config.ToolbarClass = DefaultToolbar
  }

  setSaveHandler(saveHandler) {
    this.config.saveHandler = saveHandler
  }

  setToolbarClass(ToolbarClass) {
    this.config.ToolbarClass = ToolbarClass
  }

  setFileClient(fileClient) {
    this.config.fileClient = fileClient
  }

  getFileClient() {
    return this.config.fileClient
  }

  getSaveHandler() {
    return this.config.saveHandler
  }

  getToolbarClass() {
    return this.config.ToolbarClass
  }
}

export default ProseEditorConfigurator