import Command from '../../ui/Command'

class EditInlineNodeCommand extends Command {
  constructor(...args) {
    super(...args)
    if (!this.params.nodeType) {
      throw new Error('Every AnnotationCommand must have a nodeType')
    }
  }

  getCommandState(props, context) {
    let sel = context.documentSession.getSelection()
    let newState = {
      disabled: true,
      active: false
    }
    let annos = this._getAnnotationsForSelection(props, context)
    if (annos.length === 1 && annos[0].getSelection().equals(sel)) {
      newState.disabled = false
      newState.node = annos[0]
    }
    return newState
  }

  execute(props, context) { // eslint-disable-line

  }

  _getAnnotationsForSelection(props) {
    return props.selectionState.getAnnotationsForType(this.params.nodeType)
  }

}

export default EditInlineNodeCommand
