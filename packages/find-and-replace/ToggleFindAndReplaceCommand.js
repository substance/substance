import Command from '../../ui/Command'

class ToggleFindAndReplaceCommand extends Command {
  getCommandState () {
    return {
      disabled: false
    }
  }

  execute ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    let surface = editorSession.getFocusedSurface()
    if (surface) {
      findAndReplaceManager.enable()
    }
  }
}

export default ToggleFindAndReplaceCommand
