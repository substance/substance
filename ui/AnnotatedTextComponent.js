import Fragmenter from '../model/Fragmenter'
import Component from './Component'
import AnnotationComponent from './AnnotationComponent'
import InlineNodeComponent from '../packages/inline-node/InlineNodeComponent'

/**
  Renders an anotated text. Used internally by {@link ui/TextPropertyComponent}.

  @class
  @component
  @extends ui/Component

  @prop {String[]} path The property to be rendered.
*/

class AnnotatedTextComponent extends Component {

  /**
    Node render implementation. Use model/Fragmenter for rendering of annotations.

    @return {VirtualNode} VirtualNode created using ui/Component
   */
  render($$) {
    let el = this._renderContent($$)
      .addClass('sc-annotated-text')
      .css({ whiteSpace: "pre-wrap" })
    return el
  }

  getText() {
    return this.getDocument().get(this.props.path) || ''
  }

  getAnnotations() {
    return this.getDocument().getIndex('annotations').get(this.props.path)
  }

  _onDocumentChange(update) {
    if (update.change && update.change.updated[this.getPath()]) {
      this.rerender()
    }
  }

  _renderContent($$) {
    let text = this.getText();
    let annotations = this.getAnnotations()
    let el = $$(this.props.tagName || 'span')
    if (annotations && annotations.length > 0) {
      let fragmenter = new Fragmenter({
        onText: this._renderTextNode.bind(this),
        onEnter: this._renderFragment.bind(this, $$),
        onExit: this._finishFragment.bind(this)
      });
      fragmenter.start(el, text, annotations)
    } else {
      el.append(text)
    }
    return el
  }

  _renderTextNode(context, text) {
    if (text && text.length > 0) {
      context.append(text)
    }
  }

  _renderFragment($$, fragment) {
    let doc = this.getDocument()
    let componentRegistry = this.getComponentRegistry()
    let node = fragment.node
    if (node.type === "container-annotation-fragment") {
      return $$(AnnotationComponent, { doc: doc, node: node })
        .addClass("se-annotation-fragment")
        .addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"));
    } else if (node.type === "container-annotation-anchor") {
      return $$(AnnotationComponent, { doc: doc, node: node })
        .addClass("se-anchor")
        .addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"))
        .addClass(node.isStart?"start-anchor":"end-anchor")
    }
    let ComponentClass = componentRegistry.get(node.type) || AnnotationComponent
    if (node.constructor.isInline &&
        // opt-out for custom implementations
        !ComponentClass.isCustom &&
        // also no extra wrapping if the node is already an inline node
        !ComponentClass.prototype._isInlineNodeComponent) {
      ComponentClass = InlineNodeComponent
    }
    let el = $$(ComponentClass, { doc: doc, node: node })
    return el
  }

  _finishFragment(fragment, context, parentContext) {
    parentContext.append(context)
  }

  /**
    Gets document instance.

    @return {Document} The document instance
   */
  getDocument() {
    return this.props.doc || this.context.doc
  }

}

export default AnnotatedTextComponent
