import Fragmenter from '../model/Fragmenter'
import Component from './Component'

/**
  Renders an anotated text. Used internally by {@link ui/TextPropertyComponent}.

  @class
  @component
  @extends ui/Component

  @prop {String[]} path The property to be rendered.
*/

class AnnotatedTextComponent extends Component {
  render ($$) {
    let el = this._renderContent($$)
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

  _onDocumentChange (update) {
    if (update.change && update.change.updated[this.getPath()]) {
      this.rerender()
    }
  }

  _renderContent ($$) {
    let text = this.getText()
    let annotations = this.getAnnotations()
    let el = $$(this._getTagName() || 'span')
    if (annotations && annotations.length > 0) {
      let fragmenter = new Fragmenter({
        onText: this._renderTextNode.bind(this),
        onEnter: this._renderFragment.bind(this, $$),
        onExit: this._finishFragment.bind(this)
      })
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
    let node = fragment.node

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

    let ComponentClass = this._getFragmentComponentClass(node)
    let props = this._getFragmentProps(node)
    let el = $$(ComponentClass, props)
    return el
  }

  _getFragmentComponentClass (node, noDefault) {
    let ComponentClass = this.getComponent(node.type, 'not-strict')
    if (node.constructor.isInline &&
        // also no extra wrapping if the node is already an inline node
        !ComponentClass.prototype._isInlineNodeComponent &&
        // opt-out for custom implementations
        !ComponentClass.isCustom) {
      ComponentClass = this.getComponent('inline-node')
    }
    if (!ComponentClass && !noDefault) {
      ComponentClass = this._getUnsupportedInlineNodeComponentClass()
    }
    return ComponentClass
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

export default AnnotatedTextComponent
