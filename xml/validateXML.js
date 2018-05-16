export default function validateXML (xmlSchema, dom) {
  let root = dom.find(xmlSchema.getStartElement())
  if (!root) {
    return {
      errors: [{
        msg: 'Start element is missing.',
        el: dom
      }]
    }
  } else {
    return validateElement(xmlSchema, root)
  }
}

function validateElement (xmlSchema, el) {
  let errors = []
  let valid = true
  let q = [el]
  while (q.length > 0) {
    let next = q.shift()
    let res = xmlSchema.validateElement(next)
    if (!res.ok) {
      errors = errors.concat(res.errors)
      valid = false
    }
    if (next.isElementNode()) {
      q = q.concat(next.getChildren())
    }
  }
  return {
    errors: errors,
    ok: valid
  }
}
