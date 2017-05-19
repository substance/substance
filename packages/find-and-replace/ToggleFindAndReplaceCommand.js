import { Command } from '../../ui'

class ToggleFindAndReplaceCommand extends Command {

  getCommandState({editorSession}) {
    let findAndReplaceState = editorSession.getState('find-and-replace')
    return findAndReplaceState
  }

  execute({editorSession}) {
    editorSession.updateState('find-and-replace', {
      active: true
    })
  }
}

export default ToggleFindAndReplaceCommand
