import Command from '../../ui/Command'

export default class ToggleListCommand extends Command {

  getCommandState(params) {
    let editorSession = this._getEditorSession(params)
    let doc = editorSession.getDocument()
    let sel = this._getSelection(params)
    if (sel && sel.isPropertySelection()) {
      let path = sel.path
      let node = doc.get(path[0])
      if (node && node.isListItem()) {
        let level = node.getLevel()
        let list = node.getParent()
        let listType = list.getListType(level)
        let active = listType === this.config.spec.listType
        return {
          disabled: false,
          active,
          listId: list.id,
          level
        }
      }
    }
    return { disabled: true }
  }

  execute (params) {
    let commandState = params.commandState
    if (!commandState.disabled) {
      let editorSession = params.editorSession
      // command is only active if the list node has already
      // set the level to this command's listType
      // In this case, we toggle the list
      if (commandState.active) {
        editorSession.transaction((tx) => {
          tx.toggleList()
        }, { action: 'toggleList' })
      } else {
        const { listId, level } = commandState
        editorSession.transaction((tx) => {
          let list = tx.get(listId)
          list.setListType(level, this.config.spec.listType)
        }, { action: 'setListType' })
      }
    }
  }
}
