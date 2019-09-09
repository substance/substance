import StageSession from './StageSession'
import EditorSessionMixin from './EditorSessionMixin'

export default class ModalEditorSession extends EditorSessionMixin(StageSession) {
  constructor (id, parentEditorSession, config, initialEditorState) {
    super(id, parentEditorSession, initialEditorState)

    this._setup(config, { inherit: true })
  }
}
