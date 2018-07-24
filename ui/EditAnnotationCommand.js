import EditInlineNodeCommand from './EditInlineNodeCommand'

/**
  Used for editing property annotations (e.g., such as links)
*/
export default class EditAnnotationCommand extends EditInlineNodeCommand {
  getCommandState (params, context) { // eslint-disable-line no-unused
    let sel = params.selection
    let annos = this._getAnnotationsForSelection(params)
    let newState = {
      disabled: true
    }
    if (annos.length === 1 && sel.isPropertySelection() && sel.isCollapsed()) {
      newState.disabled = false
      newState.showInContext = true
      newState.nodeId = annos[0].id
    }
    return newState
  }
}
