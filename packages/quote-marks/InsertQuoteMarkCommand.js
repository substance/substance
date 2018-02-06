import Command from '../../ui/Command'

const LEFT_QUOTE = "\u201C"
const RIGHT_QUOTE = "\u201D"

class InsertQuoteMarkCommand extends Command {

  getCommandState(params, context) { // eslint-disable-line
    // TODO: maybe only enable for specific selections?
    // let enabled = params.selection.isPropertySelection()
    return {
      disabled: false
    }
  }

  execute(params, context) { // eslint-disable-line
    let editorSession = params.editorSession
    let sel = editorSession.getSelection()
    let doc = editorSession.getDocument()
    if (sel.isPropertySelection()) {
      let nodeId = sel.start.getNodeId()
      let node = doc.get(nodeId)
      if (node.isText()) {
        let text = node.getText()
        let offset = sel.start.offset
        let mark
        if (offset === 0 || /\s/.exec(text.slice(offset-1, offset))) {
          mark = LEFT_QUOTE
        } else {
          mark = RIGHT_QUOTE
        }
        editorSession.transaction((tx) => {
          tx.insertText(mark)
        })
        return true
      }
    }
    return false
  }

}

export default InsertQuoteMarkCommand
