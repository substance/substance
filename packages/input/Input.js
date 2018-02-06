import Component from '../../ui/Component'

class Input extends Component {

  _onChange() {
    let editorSession = this.context.editorSession
    let path = this.props.path
    let newVal = this.el.val()

    editorSession.transaction(function(tx) {
      tx.set(path, newVal)
    })
  }

  render($$) {
    let val

    if (this.props.path) {
      let editorSession = this.context.editorSession
      let doc = editorSession.getDocument()
      val = doc.get(this.props.path)
    } else {
      val = this.props.value
    }

    let el = $$('input').attr({
      value: val,
      type: this.props.type,
      placeholder: this.props.placeholder
    })
    .addClass('sc-input')

    if (this.props.path) {
      el.on('change', this._onChange)
    }

    if (this.props.centered) {
      el.addClass('sm-centered')
    }

    return el
  }
}

export default Input
