import Command from '../../ui/Command'

/**
  Used for edit tools or property annotations (e.g. EditLinkTool)

  @class
*/
class SpellCheckCommand extends Command {

  getCommandState(params) {

    let state = params.selectionState
    let markers = state.getMarkers()
    if (markers.length === 0) {
      return {
        disabled: true
      }
    }
    markers = markers.filter(function(m) {
      return m.type === 'spell-error'
    })

    if (markers.length > 0) {
      return {
        disabled: false,
        active: false,
        mode: null,
        node: markers[0]
      }
    } else {
      return {
        disabled: true
      }
    }
  }
}

export default SpellCheckCommand
