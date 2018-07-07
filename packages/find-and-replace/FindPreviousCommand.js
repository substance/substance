import FindAndReplaceCommand from './FindAndReplaceCommand'

export default class FindPreviousCommand extends FindAndReplaceCommand {
  execute ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    findAndReplaceManager.findPrevious()
  }
}
