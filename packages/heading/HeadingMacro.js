import switchTextType from '../../model/transform/switchTextType'
import deleteSelection from '../../model/transform/deleteSelection'

let HeadingMacro = {

  appliesTo: ['paragraph'],

  execute: function(props, context) {
    if (this.appliesTo.indexOf(props.node.type) === -1) {
      return false;
    }
    let match = /^#\s/.exec(props.text)

    if (match) {
      let surface = context.surfaceManager.getSurface(props.selection.surfaceId)
      surface.transaction(function(tx, args) {
        let deleteSel = tx.createSelection(props.path, 0, match[0].length)
        deleteSelection(tx, {
          selection: deleteSel
        })
        let switchTextResult = switchTextType(tx, {
          selection: props.selection,
          containerId: args.containerId,
          data: {
            type: 'heading',
            level: 1
          }
        })
        if (props.action === 'type') {
          return {
            selection: tx.createSelection(switchTextResult.node.getTextPath(), 0)
          }
        }
      })
      return true
    }
  }
}

export default HeadingMacro
