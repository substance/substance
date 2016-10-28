import Component from '../../ui/Component'
// import IsolatedNodeComponent from '../isolated-node/IsolatedNodeComponent'
import TextPropertyComponent from '../../ui/TextPropertyComponent'

class ListComponent extends Component {

  constructor(...args) {
    super(...args)

    this.handleActions({
      break: this.break
    })
  }

  render($$) {
    let node = this.props.node
    let el = $$('div').addClass('sc-list').attr('contenteditable', 'true')
    node.items.forEach(function(id) {
      el.append($$(TextPropertyComponent, { path: [id, 'content'] }))
    })
    el.on('keydown', this.onKeyDown)
    return el
  }

  onKeyDown(event) {
    console.log('ListComponent.onKeyDown()');
    switch ( event.keyCode ) {
      case keys.ENTER:
        return this._break(event)
      default:
        break
    }
  }

  break() {
    console.log('TODO: break da list')
  }
}

ListComponent.prototype._isIsolatedNodeComponent = true

export default ListComponent
