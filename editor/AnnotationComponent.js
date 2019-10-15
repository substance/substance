import { Component, $$ } from '../dom'

export default class AnnotationComponent extends Component {
  render () {
    const el = $$(this.getTagName())
      .attr('data-id', this.props.node.id)
      .addClass(this.getClassNames())
    el.append(this.props.children)
    return el
  }

  getClassNames () {
    return `sc-annotation sm-${this.props.node.type}`
  }

  getTagName () {
    return 'span'
  }
}
