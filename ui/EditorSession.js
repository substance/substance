import AbstractEditorSession from './AbstractEditorSession'
import GlobalEventHandler from './GlobalEventHandler'
import EditorSessionMixin from './EditorSessionMixin'

export default class EditorSession extends EditorSessionMixin(AbstractEditorSession) {
  /**
   * @param {string} id a unique name for this editor session
   * @param {Document} document
   * @param {Configurator} config
   * @param {object} initialEditorState
   */
  constructor (id, document, config, initialEditorState = {}) {
    super(id, document, initialEditorState)

    this._setup(config)
  }

  _setup (config) {
    super._setup(config)

    this.globalEventHandler = new GlobalEventHandler(this.editorState)
  }

  dispose () {
    super.dispose()

    this.globalEventHandler.dispose()
  }
}
