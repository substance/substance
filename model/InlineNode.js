import PropertyAnnotation from './PropertyAnnotation'

export default class InlineNode extends PropertyAnnotation {
  get _isInlineNode () { return true }

  static get isInline () { return true }
}
