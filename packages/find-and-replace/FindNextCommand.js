import Command from '../../ui/Command'

class FindNextCommand extends Command {

  getCommandState() {
    return {
      disabled: false
    }
  }

  execute({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    findAndReplaceManager.findNext()
  }
}

export default FindNextCommand
