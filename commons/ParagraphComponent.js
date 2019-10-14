import { Component } from '../dom'
import { renderProperty } from '../editor'

export default class ParagraphComponent extends Component {
  render () {
    return renderProperty(this, this.props.node, 'content').addClass('sc-paragraph')
  }
}
