import { DefaultDOMElement as DOM } from '../dom'
import XMLValidator from './XMLValidator'

export default function validateXML(xmlSchema, dom) {
  let validator = new XMLValidator(xmlSchema)
  let root = dom.find(xmlSchema.getStartElement())
  let errors
  if (!root) {
    errors = [{
      msg: 'Start element is missing.',
      el: dom
    }]
  } else {
    errors = validator.validate(root)
  }
  if (errors) {
    return {
      errors
    }
  } else {
    return { ok: true }
  }
}