import Command from '../../ui/Command'

export default class ToggleListCommand extends Command {
  getCommandState (params) {
    let editorSession = params.editorSession
    let doc = editorSession.getDocument()
    let sel = editorSession.getSelection()
    if (sel && sel.isPropertySelection()) {
      let path = sel.path
      let node = doc.get(path[0])
      if (node) {
        if (node.isListItem()) {
          let level = node.getLevel()
          let list = node.getParent()
          let listType = list.getListType(level)
          let active = listType === this.config.spec.listType
          let action = active ? 'toggleList' : 'setListType'
          let listId = list.id
          return {
            disabled: false,
            active,
            action,
            listId,
            level
          }
        } else if (node.isText() && node.isBlock) {
          return {
            disabled: false,
            action: 'switchTextType'
          }
        }
      }
    }
    return { disabled: true }
  }

  execute (params) {
    let commandState = params.commandState
    const { disabled, action } = commandState
    if (disabled) return

    let editorSession = params.editorSession
    switch (action) {
      case 'toggleList': {
        editorSession.transaction((tx) => {
          tx.toggleList()
        }, { action: 'toggleList' })
        break
      }
      case 'setListType': {
        const { listId, level } = commandState
        editorSession.transaction((tx) => {
          let list = tx.get(listId)
          list.setListType(level, this.config.spec.listType)
        }, { action: 'setListType' })
        break
      }
      case 'switchTextType': {
        editorSession.transaction((tx) => {
          tx.toggleList({ listType: this.config.spec.listType })
        }, { action: 'toggleList' })
        break
      }
      default:
        //
    }
  }
}
