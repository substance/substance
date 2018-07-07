import Command from '../../ui/Command'

export default class FindAndReplaceCommand extends Command {
  getCommandState ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    if (findAndReplaceManager) {
      let findAndReplaceState = findAndReplaceManager.getCommandState()
      return findAndReplaceState
    } else {
      return { disabled: true }
    }
  }

  execute () {
    // Do nothing
  }
}
