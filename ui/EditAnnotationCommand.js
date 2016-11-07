import Command from './Command'

/**
  Used for edit tools or property annotations (e.g. EditLinkTool)

  @class
*/
class EditAnnotationCommand extends Command {

  constructor(...args) {
    super(...args)

    if (!this.config.nodeType) {
      throw new Error("'nodeType' is required")
    }
  }

  /**
    Get command state

    @return {Object} object with `disabled` and `node` properties
  */
  getCommandState(params) {
    let sel = this._getSelection(params)
    let annos = this._getAnnotationsForSelection(params)
    let newState = {
      disabled: true,
    }
    if (annos.length === 1 && sel.isPropertySelection()) {
      newState.disabled = false
      newState.node = annos[0]
    }
    return newState
  }

  execute(params) { } // eslint-disable-line

  _getAnnotationsForSelection(params) {
    return params.selectionState.getAnnotationsForType(this.config.nodeType)
  }
}

export default EditAnnotationCommand
