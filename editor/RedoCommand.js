import Command from './Command'

export default
class Redo extends Command {
  getCommandState (params) {
    const editorSession = params.editorSession
    return {
      disabled: !editorSession.canRedo(),
      active: false
    }
  }

  execute (params) {
    const editorSession = params.editorSession
    if (editorSession.canRedo()) {
      editorSession.redo()
      return true
    } else {
      return false
    }
  }
}
