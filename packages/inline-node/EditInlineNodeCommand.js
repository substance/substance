import Command from '../../ui/Command'

class EditInlineNodeCommand extends Command {
  constructor(...args) {
    super(...args)
    if (!this.config.nodeType) {
      throw new Error('Every AnnotationCommand must have a nodeType')
    }
  }

  getCommandState(params, context) {
    let sel = context.documentSession.getSelection()
    let newState = {
      disabled: true,
      active: false
    }
    let annos = this._getAnnotationsForSelection(params, context)
    if (annos.length === 1 && annos[0].getSelection().equals(sel)) {
      newState.disabled = false
      newState.node = annos[0]
    }
    return newState
  }

  execute(params, context) { // eslint-disable-line

  }

  _getAnnotationsForSelection(params) {
    return params.selectionState.getAnnotationsForType(this.config.nodeType)
  }

}

export default EditInlineNodeCommand
