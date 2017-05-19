import { Command } from '../../ui'

class FindNextCommand extends Command {

  getCommandState({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    let findAndReplaceState = findAndReplaceManager.getState()
    return findAndReplaceState
  }

  execute({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    findAndReplaceManager.findNext()
  }
}

export default FindNextCommand
