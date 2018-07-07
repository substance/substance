import Command from '../../ui/Command'

export default class ToggleFindAndReplaceCommand extends Command {
  getCommandState ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    if (findAndReplaceManager) {
      return { disabled: false }
    } else {
      return { disabled: true }
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
