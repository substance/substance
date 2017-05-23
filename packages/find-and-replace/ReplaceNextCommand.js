import { Command } from '../../ui'

class ReplaceNextCommand extends Command {

  getCommandState({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    let findAndReplaceState = findAndReplaceManager.getCommandState()
    return findAndReplaceState
  }

  execute({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    findAndReplaceManager.replaceNext()
  }
}

export default ReplaceNextCommand
