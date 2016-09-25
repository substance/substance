import AnnotationComponent from '../../ui/AnnotationComponent'

class LinkComponent extends AnnotationComponent {

  didMount(...args) {
    super.didMount(...args)

    let node = this.props.node
    node.on('properties:changed', this.rerender, this)
  }

  dispose(...args) {
    super.dispose(...args)

    let node = this.props.node
    node.off(this)
  }

  render($$) { // eslint-disable-line
    let el = super.render($$)

    el.tagName = 'a'
    el.attr('href', this.props.node.url)

    let titleComps = [this.props.node.url]
    if (this.props.node.title) {
      titleComps.push(this.props.node.title)
    }

    return el.attr("title", titleComps.join(' | '))
  }

}

export default LinkComponent
