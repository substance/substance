import { Command } from '../../ui'

class ToggleFindAndReplaceCommand extends Command {

  getCommandState({editorSession}) {
    return {
      disabled: false
    }
  }

  execute({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    let findAndReplaceState = findAndReplaceManager.getCommandState()
    let surface =  editorSession.getFocusedSurface()
    if (surface) {
      findAndReplaceManager.enable()
    }
  }
}

export default ToggleFindAndReplaceCommand
