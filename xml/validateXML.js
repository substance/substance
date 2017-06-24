import { DefaultDOMElement as DOM } from '../dom'
import XMLValidator from './XMLValidator'

export default function validateXML(xmlSchema, dom) {
  let validator = new XMLValidator(xmlSchema)
  let root = dom.find(xmlSchema.getStartElement())
  if (!root) {
    return  {
      errors: ['Start element is missing.']
    }
  } else {
    if (!validator.isValid(root)) {
      return {
        errors: validator.errors,
        elements: validator.errorElements.map(el => el.getNativeElement())
      }
    } else {
      return {}
    }
  }
}