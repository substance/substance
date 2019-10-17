import { Component, $$ } from '../dom'
import { renderProperty } from '../editor'

export default class HeadingComponent extends Component {
  render () {
    const node = this.props.node
    const headingOffset = this.context.headingOffset || 0
    const level = headingOffset + this._getLevel()

    return $$('div', { class: `sc-heading sm-level-${level}` },
      renderProperty(this, node.getDocument(), [node.id, 'content'])
    )
  }

  _getLevel () {
    return Math.max(1, this.props.node.level)
  }
}
