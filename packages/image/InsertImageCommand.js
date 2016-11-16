import Command from '../../ui/Command'
import insertImage from './insertImage'

class ImageCommand extends Command {

  getCommandState(params) {
    let sel = params.selection
    let surface = params.surface
    let newState = {
      disabled: true,
      active: false
    }
    if (sel && !sel.isNull() && !sel.isCustomSelection() &&
        surface && surface.isContainerEditor()) {
      newState.disabled = false
    }
    return newState
  }

  /*
    Inserts file and image nodes
  */
  execute(params) {
    let editorSession = params.editorSession

    editorSession.transaction((tx) => {
      params.files.forEach((file) => {
        insertImage(tx, file)
      })
    })
  }

}

export default ImageCommand
