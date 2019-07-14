import Surface from './Surface'

/**
 * Editor for a text property (annotated string). Needs to be
 * instantiated inside a {@link ui/Controller} context.
 *
 * @param {string} props.name unique editor name
 * @param {string[]} props.path path to a text property
 *
 * @example
 *
 * Create a `TextPropertyEditor` for the `name` property of an author object.
 *
 * ```js
 * $$(TextPropertyEditor, {
 *   name: 'authorNameEditor',
 *   path: ['author_1', 'name']
 * })
 * ```
 */
export default class TextPropertyEditor extends Surface {
  constructor (parent, props) {
    // making props.name optional
    props.name = props.name || props.path.join('.')
    super(parent, props)

    if (!props.path) {
      throw new Error("Property 'path' is mandatory.")
    }
  }

  didMount () {
    super.didMount()

    let editorState = this.context.editorSession.getEditorState()
    editorState.addObserver(['selection'], this._onSelectionChanged, this, {
      stage: 'render'
    })
  }

  dispose () {
    super.dispose()

    let editorState = this.context.editorSession.getEditorState()
    editorState.removeObserver(this)
  }

  render ($$) {
    const TextPropertyComponent = this.getComponent('text-property')

    let el = super.render.apply(this, arguments)

    if (!this.props.disabled) {
      el.addClass('sm-enabled')
      el.attr('contenteditable', true)
      // native spellcheck
      el.attr('spellcheck', this.props.spellcheck === 'native')
    }

    el.append(
      $$(TextPropertyComponent, {
        doc: this.getDocument(),
        placeholder: this.props.placeholder,
        tagName: this.props.tagName || 'div',
        path: this.props.path,
        markers: this.props.markers,
        withoutBreak: this.props.withoutBreak
      }).ref('property')
    )

    if (this.isEditable()) {
      el.addClass('sm-editable')
    } else {
      el.addClass('sm-readonly')
      // HACK: removing contenteditable if not editable
      // TODO: we should fix substance.TextPropertyEditor to be consistent with props used in substance.Surface
      el.setAttribute('contenteditable', false)
    }

    return el
  }

  _getClassNames () {
    return 'sc-text-property-editor sc-surface'
  }

  selectFirst () {
    this.editorSession.setSelection({
      type: 'property',
      path: this.getPath(),
      startOffset: 0,
      surfaceId: this.id
    })
  }

  getPath () {
    return this.props.path
  }

  _handleEnterKey (event) {
    event.stopPropagation()
    event.preventDefault()
    if (this.props.multiLine) {
      this.type('\n')
    }
  }

  _handleEscapeKey (event) {
    this.el.emit('escape', {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      code: event.code
    })
  }

  get _isTextPropertyEditor () { return true }
}
