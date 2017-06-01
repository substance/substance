import { Command } from '../../ui'

class ToggleFindAndReplaceCommand extends Command {

  getCommandState() {
    return {
      disabled: false
    }
  }

  execute({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    let findAndReplaceState = findAndReplaceManager.getCommandState()
    if (!findAndReplaceState.disabled) {
      findAndReplaceManager.disable()
    }
  }
}

export default ToggleFindAndReplaceCommand
