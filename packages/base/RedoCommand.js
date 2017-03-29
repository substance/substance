import { Command } from '../../ui'

export default
class Redo extends Command {

  getCommandState(params) {
    let editorSession = params.editorSession
    return {
      disabled: !editorSession.canRedo(),
      active: false
    }
  }

  execute(params) {
    let editorSession = params.editorSession
    if (editorSession.canRedo()) {
      editorSession.redo()
      return true
    } else {
      return false
    }
  }

}