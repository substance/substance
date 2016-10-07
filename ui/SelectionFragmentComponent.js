import Component from './Component'

class SelectionFragmentComponent extends Component {

  render($$) {
    // TODO: we should rename se-cursor to sc-cursor
    let el = $$('span').addClass('se-selection-fragment')
    if (this.props.collaborator) {
      let collaboratorIndex = this.props.collaborator.colorIndex
      el.addClass('sm-collaborator-'+collaboratorIndex)
    } else {
      el.addClass('sm-local-user')
    }
    el.append(this.props.children)
    return el
  }

}

export default SelectionFragmentComponent
