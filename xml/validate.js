import { DefaultDOMElement as DOM } from '../dom'
import Validator from './Validator'

export default function validate(xmlSchema, dom) {
  let validator = new Validator(xmlSchema)
  // TODO: for sake of generality we should take the start element from the schema
  let root = dom.find('article')
  if (!root) {
    return 'Start element is missing.'
  } else {
    if (!validator.isValid(root)) {
      return {
        errors: validator.errors,
        elements: validator.errorElements.map(el => el.getNativeElement())
      }
    }
  }
}