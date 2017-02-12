export default {

  appliesTo: ['paragraph'],

  execute: function(props) {
    if (this.appliesTo.indexOf(props.node.type) === -1) {
      return false
    }
    if (props.action !== 'type') {
      return false
    }
    let match = /^#\s/.exec(props.text)
    if (match) {
      // console.log('Applying HeadingMacro')
      let editorSession = props.editorSession
      let sel = editorSession.getSelection()
      let path = sel.start.path
      let startOffset = sel.start.offset
      editorSession.transaction(function(tx) {
        tx.setSelection({
          type: 'property',
          path: path,
          startOffset: 0,
          endOffset: match[0].length
        })
        tx.deleteSelection()
        let node = tx.switchTextType({
          type: 'heading',
          level: 1
        })
        tx.setSelection({
          type: 'property',
          path: node.getTextPath(),
          startOffset: startOffset - match[0].length
        })
      })
      return true
    }
  }
}
