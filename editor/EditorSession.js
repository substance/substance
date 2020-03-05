import AbstractEditorSession from './AbstractEditorSession'
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
}
