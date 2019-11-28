import Fragmenter from '../model/Fragmenter'
import Component from '../dom/Component'

/**
  Renders an anotated text. Used internally by `TextPropertyComponent`.

  @prop {String[]} path The property to be rendered.
*/
export default class AnnotatedTextComponent extends Component {
  render ($$) {
    const el = this._renderContent($$)
      .addClass('sc-annotated-text')
      .css({ whiteSpace: 'pre-wrap' })
    return el
  }

  getPath () {
    return this.props.path
  }

  getText () {
    return this.getDocument().get(this.props.path) || ''
  }

  isEmpty () {
    return !(this.getText())
  }

  getAnnotations () {
    return this.getDocument().getIndex('annotations').get(this.props.path)
  }

  getDocument () {
    return this.props.doc || this.context.doc
  }

  _getTagName () {
    return this.props.tagName
  }

  _renderContent ($$) {
    const text = this.getText()
    const annotations = this.getAnnotations()
    const el = $$(this._getTagName() || 'span')
    if (annotations && annotations.length > 0) {
      const fragmenter = new Fragmenter()
      fragmenter.onText = this._renderTextNode.bind(this)
      fragmenter.onOpen = this._renderFragment.bind(this, $$)
      fragmenter.onClose = this._finishFragment.bind(this)
      fragmenter.start(el, text, annotations)
    } else {
      el.append(text)
    }
    return el
  }

  _renderTextNode (context, text) {
    if (text && text.length > 0) {
      context.append(text)
    }
  }

  _renderFragment ($$, fragment) {
    const node = fragment.node

    // TODO: fix support for container annotations
    // if (node.type === 'container-annotation-fragment') {
    //   return $$(AnnotationComponent, { doc: doc, node: node })
    //     .addClass("se-annotation-fragment")
    //     .addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"));
    // } else if (node.type === 'container-annotation-anchor') {
    //   return $$(AnnotationComponent, { doc: doc, node: node })
    //     .addClass("se-anchor")
    //     .addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"))
    //     .addClass(node.isStart?"start-anchor":"end-anchor")
    // } else {
    //   ...
    // }

    const ComponentClass = this._getFragmentComponentClass(node)
    const props = this._getFragmentProps(node)
    const el = $$(ComponentClass, props)
    return el
  }

  _getFragmentComponentClass (node, noDefault) {
    let ComponentClass = this.getComponent(node.type, 'not-strict')
    if (node.isInlineNode() &&
        // also no extra wrapping if the node is already an inline node
        !ComponentClass.prototype._isInlineNodeComponent &&
        // opt-out for custom implementations
        !ComponentClass.isCustom) {
      ComponentClass = this.getComponent('inline-node')
    }
    if (!ComponentClass && !noDefault) {
      if (node._isAnnotation) {
        ComponentClass = this._getUnsupportedAnnotationComponentClass()
      } else {
        ComponentClass = this._getUnsupportedInlineNodeComponentClass()
      }
    }
    return ComponentClass
  }

  _getUnsupportedAnnotationComponentClass () {
    return this.getComponent('annotation')
  }

  _getUnsupportedInlineNodeComponentClass () {
    return this.getComponent('annotation')
  }

  _getFragmentProps (node) {
    return { node }
  }

  _finishFragment (fragment, context, parentContext) {
    parentContext.append(context)
  }
}
