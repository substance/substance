import InsertNodeCommand from '../../ui/InsertNodeCommand'
import insertImage from './insertImage'

export default class InsertImageCommand extends InsertNodeCommand {

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
