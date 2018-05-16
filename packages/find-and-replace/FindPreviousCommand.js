import Command from '../../ui/Command'

class FindPreviousCommand extends Command {
  getCommandState ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    let findAndReplaceState = findAndReplaceManager.getCommandState()
    return findAndReplaceState
  }

  execute ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    findAndReplaceManager.findPrevious()
  }
}

export default FindPreviousCommand
