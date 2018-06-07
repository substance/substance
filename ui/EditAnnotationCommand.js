import Command from './Command'

/**
  Used for edit tools or property annotations (e.g. EditLinkTool)
*/
export default class EditAnnotationCommand extends Command {
  constructor (...args) {
    super(...args)

    if (!this.config.nodeType) {
      throw new Error("'nodeType' is required")
    }
  }

  /**
    Get command state

    @return {Object} object with `disabled` and `node` properties
  */
  getCommandState (params, context) { // eslint-disable-line no-unused
    let sel = this._getSelection(params)
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

  execute (params, context) { } // eslint-disable-line no-unused

  _getAnnotationsForSelection (params) {
    return params.selectionState.getAnnotationsForType(this.config.nodeType)
  }
}
