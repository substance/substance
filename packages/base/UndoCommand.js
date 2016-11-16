import Command from '../../ui/Command'

class Undo extends Command {

  getCommandState(params) {
    let editorSession = params.editorSession
    return {
      disabled: !editorSession.canUndo(),
      active: false
    }
  }

  execute(params) {
    let editorSession = params.editorSession
    if (editorSession.canUndo()) {
      editorSession.undo()
      return true
    }
    return false
  }

}

export default Undo
