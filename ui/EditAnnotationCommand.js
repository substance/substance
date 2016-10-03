import Command from './Command'

/**
  Used for edit tools or property annotations (e.g. EditLinkTool)

  @class
*/
class EditAnnotationCommand extends Command {

  constructor(...args) {
    super(...args)

    if (!this.params.nodeType) {
      throw new Error("'nodeType' is required")
    }
  }

  getCommandState(props, context) { // eslint-disable-line
    context = context || {}
    let sel = this._getSelection(props)
    let annos = this._getAnnotationsForSelection(props, context)
    let newState = {
      disabled: true,
    }

    if (annos.length === 1 && sel.isPropertySelection()) {
      newState.disabled = false
      newState.node = annos[0]
    }
    return newState
  }

  execute(props, context) { } // eslint-disable-line

  _getAnnotationsForSelection(props) {
    return props.selectionState.getAnnotationsForType(this.params.nodeType)
  }
}

export default EditAnnotationCommand
