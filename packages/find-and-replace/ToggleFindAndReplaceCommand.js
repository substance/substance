import { Command } from '../../ui'

class ToggleFindAndReplaceCommand extends Command {

  getCommandState() {
    return {
      disabled: false
    }
  }

  execute({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    findAndReplaceManager.toggle()
  }
}

export default ToggleFindAndReplaceCommand
