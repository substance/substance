import Surface from './Surface'
import TextPropertyComponent from './TextPropertyComponent'

/**
  Editor for a text property (annotated string). Needs to be
  instantiated inside a {@link ui/Controller} context.

  @class
  @component
  @extends ui/Surface

  @prop {String} name unique editor name
  @prop {String[]} path path to a text property
  @prop {ui/SurfaceCommand[]} commands array of command classes to be available

  @example

  Create a `TextPropertyEditor` for the `name` property of an author object. Allow emphasis annotations.

  ```js
  $$(TextPropertyEditor, {
    name: 'authorNameEditor',
    path: ['author_1', 'name'],
    commands: [EmphasisCommand]
  })
  ```
*/

class TextPropertyEditor extends Surface {

  constructor(parent, props) {
    // making props.name optional
    props.name = props.name || props.path.join('.')
    super(parent, props)

    if (!props.path) {
      throw new Error("Property 'path' is mandatory.")
    }
  }

  render($$) {
    let el = super.render.apply(this, arguments)
    el.addClass("sc-text-property-editor")

    if (!this.props.disabled) {
      el.addClass('sm-enabled')
      el.attr('contenteditable', true)
      // native spellcheck
      el.attr('spellcheck', this.props.spellcheck === 'native')
    }

    el.append(
      $$(TextPropertyComponent, {
        placeholder: this.props.placeholder,
        tagName: this.props.tagName || "div",
        path: this.props.path,
        markers: this.props.markers,
        withoutBreak: this.props.withoutBreak
      }).ref('property')
    )

    return el
  }

  selectFirst() {
    this.editorSession.setSelection({
      type: "property",
      path: this.getPath(),
      startOffset: 0,
      surfaceId: this.id
    })
  }

  getPath() {
    return this.props.path
  }

  _handleEnterKey(event) {
    event.stopPropagation()
    if (!this.props.multiLine) {
      event.preventDefault()
      super._handleEnterKey(event)
    }
    this.el.emit('enter', {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      code: event.code
    })
  }

  // TODO: this is somewhat manually, maybe we find a better way to

  _handleEscapeKey(event) {
    this.el.emit('escape', {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      code: event.code
    })
  }
}

TextPropertyEditor.prototype._isTextPropertyEditor = true

export default TextPropertyEditor
