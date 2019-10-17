import { Component } from '../dom'
import { renderProperty } from '../editor'

export default class ParagraphComponent extends Component {
  render () {
    const node = this.props.node
    return renderProperty(this, node.getDocument(), [node.id, 'content']).addClass('sc-paragraph')
  }
}
