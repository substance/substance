import Component from '../../ui/Component'
import TextPropertyEditor from '../../ui/TextPropertyEditor'

class TextCellContent extends Component {

  render($$) {
    let el = $$('div').addClass('sc-text-cell')

    let path
    if (this.props.node) {
      path = this.props.node.getTextPath()
    } else {
      path = this.props.path
    }

    el.append($$(TextPropertyEditor, {
      path: path,
      disabled: this.props.disabled
    }).ref('editor'))

    return el
  }

}

export default TextCellContent
