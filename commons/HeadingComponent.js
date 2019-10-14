import { Component, $$ } from '../dom'
import { renderProperty } from '../editor'

export default class HeadingComponent extends Component {
  render () {
    const headingOffset = this.context.headingOffset || 0
    const level = headingOffset + this._getLevel()

    return $$('div', { class: `sc-heading sm-level-${level}` },
      renderProperty(this, this.props.node, 'content')
    )
  }

  _getLevel () {
    return Math.max(1, this.props.node.level)
  }
}
