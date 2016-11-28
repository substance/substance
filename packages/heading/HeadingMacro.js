let HeadingMacro = {

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
      let editorSession = props.editorSession
      editorSession.postpone(() => {
        editorSession.transaction(function(tx) {
          tx.select({
            startPath: props.path,
            startOffset: 0,
            endOffset: match[0].length
          })
          tx.deleteSelection()
          tx.switchTextType({
            type: 'heading',
            level: 1
          })
        })
      })
      return true
    }
  }
}

export default HeadingMacro