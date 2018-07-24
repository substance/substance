import AbstractGlobalEventHandler from '../ui/AbstractGlobalEventHandler'

export default class DeprecatedGlobalEventHandler extends AbstractGlobalEventHandler {
  constructor (editorSession) {
    super()

    this.editorSession = editorSession
  }

  getSelection () {
    return this.editorSession.getSelection()
  }
}
