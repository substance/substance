import { $$, Component } from '../dom'
import { getKeyForPath, isNil } from '../util'
import Surface from './Surface'
import ContainerEditor from './ContainerEditor'
import _renderNode from './_renderNode'

export default function renderProperty (comp, document, path, props = {}) {
  const propSpec = document.getProperty(path)
  if (!propSpec) {
    throw new Error(`Could not find property for path ${path}`)
  }

  // TODO: rethink the meaning of 'disabled' vs 'readOnly'
  const disabled = comp.props.disabled || props.readOnly

  props = Object.assign({
    document,
    path,
    disabled,
    placeholder: comp.props.placeholder
  }, props)

  switch (propSpec.reflectionType) {
    case 'integer':
    case 'number':
    case 'boolean':
    case 'string-array':
    case 'one':
    case 'many':
      throw new Error('NOT IMPLEMENTED YET')
    case 'string':
    case 'text':
      return $$(StringComponent, props)
    case 'child':
      return _renderNode(comp, document.resolve(path), props)
    case 'children':
      return $$(CollectionComponent, props)
    case 'container':
      // Note: do not override user props or value settings
      if (isNil(props.container)) {
        props.container = true
      }
      return $$(CollectionComponent, props)
    default:
      throw new Error('Unsupported type')
  }
}

class TextInput extends Surface {
  render () {
    const { placeholder, path, spellcheck, disabled } = this.props
    const TextPropertyComponent = this.getComponent('text-property')
    const isEditable = this.isEditable()
    // TODO: we should refactor Substance.TextPropertyEditor so that it can be used more easily
    const el = Surface.prototype.render.call(this, $$)
    el.addClass('sc-text-input')
    // Attention: being disabled does not necessarily mean not-editable, whereas non-editable is always disabled
    // A Surface can also be disabled because it is blurred, for instance.
    if (isEditable) {
      el.addClass('sm-editable')
      if (!disabled) {
        el.addClass('sm-enabled')
        el.attr('contenteditable', true)
        // native spellcheck
        el.attr('spellcheck', spellcheck === 'native')
      }
    } else {
      el.addClass('sm-readonly')
    }
    const content = $$(TextPropertyComponent, {
      doc: this.getDocument(),
      tagName: 'div',
      placeholder,
      path
    }).addClass('se-input')
    el.append(content)
    return el
  }

  // this is needed e.g. by SelectAllCommand
  get _isTextPropertyEditor () {
    return true
  }

  // this is needed e.g. by SelectAllCommand
  getPath () {
    return this.props.path
  }
}

class StringComponent extends Component {
  render () {
    const { placeholder, path, readOnly, document, inline } = this.props
    let tagName = 'div'
    let withoutBreak = false
    if (inline) {
      tagName = 'span'
      withoutBreak = true
    }
    const parentSurface = this.context.surface
    const name = getKeyForPath(path)
    // Note: readOnly and within a ContainerEditor a text property is
    // plain, not as a surface
    if (readOnly || (parentSurface && parentSurface._isContainerEditor)) {
      const TextPropertyComponent = this.getComponent('text-property')
      return $$(TextPropertyComponent, {
        doc: document,
        tagName,
        placeholder,
        path,
        withoutBreak
      })
    } else {
      return $$(TextInput, {
        name,
        path,
        placeholder
      })
    }
  }
}

class CollectionComponent extends Component {
  render () {
    const props = this.props
    const { container, path } = props
    let renderAsContainer
    if (!isNil(container)) {
      renderAsContainer = Boolean(container)
    }
    if (renderAsContainer) {
      return $$(EditableCollection, Object.assign({}, props, {
        containerPath: path
      }))
    } else {
      return $$(ReadOnlyCollection, props)
    }
  }
}

class ReadOnlyCollection extends Component {
  // NOTE: this is less efficient than ContainerEditor as it will always render the whole collection
  render () {
    const { document, path, disabled, readOnly } = this.props
    const el = $$('div').addClass('sc-collection').attr('data-id', getKeyForPath(path))
    const items = document.resolve(path)
    el.append(
      items.map(item => _renderNode(this, item, { disabled, readOnly }).ref(item.id))
    )
    return el
  }
}

class EditableCollection extends ContainerEditor {
  _getClassNames () {
    return 'sc-collection sc-container-editor sc-surface'
  }
}
