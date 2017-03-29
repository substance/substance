import Command from './Command'

class EditInlineNodeCommand extends Command {
  constructor(...args) {
    super(...args)
    if (!this.config.nodeType) {
      throw new Error('Every AnnotationCommand must have a nodeType')
    }
  }

  getCommandState(params) {
    let sel = params.selection
    let newState = {
      disabled: true,
      active: false
    }
    let annos = this._getAnnotationsForSelection(params)
    if (annos.length === 1 && annos[0].getSelection().equals(sel)) {
      newState.disabled = false
      newState.node = annos[0]
    }
    return newState
  }

  execute(params) { // eslint-disable-line

  }

  _getAnnotationsForSelection(params) {
    return params.selectionState.getAnnotationsForType(this.config.nodeType)
  }

}

export default EditInlineNodeCommand
