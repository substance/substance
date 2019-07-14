import { getKeyForPath } from '../util'
import Component from './Component'

export default class TextNodeComponent extends Component {
  /*
    NOTE: text updates are observed by TextPropertyComponent
    If necessary override this method and add other observers
  */
  didMount () {}

  render ($$) {
    let parentSurface = this.context.surface
    let TextPropertyComponent
    // render the TextNode as Surface if the parent is not a ContainerEditor
    if (parentSurface && parentSurface.isContainerEditor()) {
      // Note: when inside a ContainerEditor, then this is not a editor itself
      TextPropertyComponent = this.getComponent('text-property')
    } else {
      TextPropertyComponent = this.getComponent('text-property-editor')
    }
    const node = this.props.node
    const tagName = this.getTagName()
    const path = node.getPath()
    let el = $$(tagName)
      .addClass(this.getClassNames())
      .attr('data-id', node.id)
    el.append(
      $$(TextPropertyComponent, {
        doc: node.getDocument(),
        name: getKeyForPath(path),
        path,
        placeholder: this.props.placeholder
      })
    )
    // TODO: ability to edit attributes
    return el
  }

  getTagName () {
    return 'div'
  }

  getClassNames () {
    // TODO: don't violate the 'sc-' contract
    return 'sc-text-node sm-' + this.props.node.type
  }
}
