import Component from './Component'

class CursorComponent extends Component {
  render ($$) {
    // TODO: we should rename se-cursor to sc-cursor
    let el = $$('span').addClass('se-cursor')
    // Add zero-width character. Since we have a non-empty element, the
    // outline style set on the cursor would not be visible in certain
    // scenarios (e.g. when cursor is at the very beginning of a text.
    el.append('\uFEFF')
    el.append($$('div').addClass('se-cursor-inner'))

    if (this.props.collaborator) {
      let collaboratorIndex = this.props.collaborator.colorIndex
      el.addClass('sm-collaborator-' + collaboratorIndex)
    } else {
      el.addClass('sm-local-user')
    }

    return el
  }
}

export default CursorComponent
