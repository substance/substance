import Component from '../../ui/Component'
import keys from '../../util/keys'

export default class Input extends Component {
  render ($$) {
    let val = this._getDocumentValue()

    let el = $$('input').attr({
      value: val,
      type: this.props.type,
      placeholder: this.props.placeholder
    }).addClass('sc-input')
      .val(val)
      .on('keydown', this._onKeydown)

    if (this.props.path) {
      el.on('change', this._onChange)
    }

    if (this.props.centered) {
      el.addClass('sm-centered')
    }

    return el
  }

  _onChange () {
    let editorSession = this.context.editorSession
    let path = this.props.path
    let newVal = this.el.val()
    let oldVal = this._getDocumentValue()
    if (newVal !== oldVal) {
      editorSession.transaction(function (tx) {
        tx.set(path, newVal)
      })
      if (this.props.retainFocus) {
        // ATTENTION: running the editor flow will rerender the model selection
        // which takes away the focus from this input
        this.el.getNativeElement().focus()
      }
    }
  }

  _getDocumentValue () {
    if (this.props.val) {
      return this.props.val
    } else {
      let editorSession = this.context.editorSession
      let path = this.props.path
      return editorSession.getDocument().get(path)
    }
  }

  _onKeydown (event) {
    if (event.keyCode === keys.ESCAPE) {
      event.stopPropagation()
      event.preventDefault()
      this.el.val(this._getDocumentValue())
    }
  }
}
