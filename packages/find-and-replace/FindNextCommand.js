import ToggleFindAndReplaceCommand from './ToggleFindAndReplaceCommand'

export default class FindNextCommand extends ToggleFindAndReplaceCommand {
  execute ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    findAndReplaceManager.findNext()
  }
}
