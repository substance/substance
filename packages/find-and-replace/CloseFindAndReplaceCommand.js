import Command from '../../ui/Command'

export default class CloseFindAndReplaceCommand extends Command {
  getCommandState ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    if (findAndReplaceManager) {
      let state = findAndReplaceManager.getCommandState()
      return {
        disabled: state.disabled
      }
    } else {
      return { disabled: true }
    }
  }

  execute ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    let findAndReplaceState = findAndReplaceManager.getCommandState()
    if (!findAndReplaceState.disabled) {
      findAndReplaceManager.disable()
    }
  }
}
