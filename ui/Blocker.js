import { Component, $$ } from '../dom'

export default class Blocker extends Component {
  render () {
    return $$(this.props.tagName || 'div', { class: 'sc-blocker', style: 'position:absolute;top:0;bottom:0;left:0;right:0;' })
  }
}
