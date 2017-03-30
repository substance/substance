import { InsertNodeCommand } from '../../ui'
import insertImage from './insertImage'

class ImageCommand extends InsertNodeCommand {

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
