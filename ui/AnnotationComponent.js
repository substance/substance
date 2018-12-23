import Component from './Component'

/**
 * Renders an annotation. Used internally by different components (e.g. ui/AnnotatedTextComponent)
 *
 *
 * @example
 *
 *  ```js
 *  $$(AnnotationComponent, {
 *    model
 *  })
 * ```
*/

export default class AnnotationComponent extends Component {
  render ($$) {
    let model = this.props.model
    let el = $$(this.getTagName())
      .attr('data-id', model.id)
      .addClass(this.getClassNames())
    el.append(this.props.children)
    return el
  }

  getClassNames () {
    // TODO: this violates the convention that the class prefix 'sc-...' is used only by the Component itself
    return `sc-annotation sm-${this.props.model.type}`
  }

  getTagName () {
    return 'span'
  }
}
