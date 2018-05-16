import Command from './Command'

class EditInlineNodeCommand extends Command {
  constructor (...args) {
    super(...args)
    if (!this.config.nodeType) {
      throw new Error('Every AnnotationCommand must have a nodeType')
    }
  }

  getCommandState (params) {
    let sel = params.selection
    let newState = {
      disabled: true,
      active: false
    }
    let annos = this._getAnnotationsForSelection(params)

    // Among the annotations found we need to pick the first that exactly
    // matches the current selection
    if (annos.length > 0) {
      annos.forEach(anno => {
        if (anno.getSelection().equals(sel)) {
          newState.disabled = false
          newState.nodeId = anno.id
        }
      })
    }
    return newState
  }

  execute(params) { // eslint-disable-line

  }

  _getAnnotationsForSelection (params) {
    return params.selectionState.getAnnotationsForType(this.config.nodeType)
  }
}

export default EditInlineNodeCommand
