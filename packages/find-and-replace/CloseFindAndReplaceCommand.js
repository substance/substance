import Command from '../../ui/Command'

class ToggleFindAndReplaceCommand extends Command {
  getCommandState ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    let state = findAndReplaceManager.getCommandState()
    return {
      disabled: state.disabled
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

export default ToggleFindAndReplaceCommand
