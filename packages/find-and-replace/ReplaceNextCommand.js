import FindAndReplaceCommand from './FindAndReplaceCommand'

export default class ReplaceNextCommand extends FindAndReplaceCommand {
  execute ({editorSession}) {
    let findAndReplaceManager = editorSession.getManager('find-and-replace')
    findAndReplaceManager.replaceNext()
  }
}
