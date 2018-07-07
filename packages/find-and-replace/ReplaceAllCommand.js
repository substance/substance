import FindAndReplaceCommand from './FindAndReplaceCommand'

export default class ReplaceAllCommand extends FindAndReplaceCommand {
  execute ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    findAndReplaceManager.replaceAll()
  }
}
