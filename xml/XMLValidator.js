import DFA from './DFA'

const TEXT = DFA.TEXT
const START = DFA.START

export default
class XMLValidator {

  constructor(xmlSchema) {
    this.schema = xmlSchema
    this.errors = []
    this.errorElements = []
  }

  getElementValidator(tagName) {
    let spec = this.schema.getElementSchema(tagName)
    if (!spec) throw new Error(`Unsupported element: ${tagName}`)
    return new ElementValidator(spec)
  }

  isValid(el) {
    const name = el.tagName
    const elValidator = this.getElementValidator(name)
    const errors = elValidator.checkAttributes(el)
    if (errors) {
      this.errors = this.errors.concat(errors)
    }
    if (elValidator.spec.type === 'external') {
      return true
    }
    const iterator = el.getChildNodeIterator()
    let valid = true
    while (valid && iterator.hasNext()) {
      let error = null
      const childEl = iterator.next()
      let token
      if (childEl.isTextNode()) {
        if (/^\s*$/.exec(childEl.textContent)) {
          continue
        }
        token = TEXT
      } else if (childEl.isElementNode()) {
        token = childEl.tagName
      } else {
        continue
      }
      error = elValidator.consume(token)
      if (error) {
        this.errors.push(error)
        this.errorElements.push(el)
        valid = false
      }
    }
    if (valid && !elValidator.isFinished()) {
      this.errors.push(`<${el.tagName}> is incomplete`)
      this.errorElements.push(el)
      valid = false
    }
    el.children.forEach((child) => {
      valid &= this.isValid(child)
    })
    return valid
  }

  getValidatingChildNodeIterator(el) {
    return new ValidatingChildNodeIterator(el.getChildNodeIterator(), this.getElementValidator(el.tagName))
  }
}

class ElementValidator {

  constructor(spec) {
    this.spec = spec
    this.dfa = spec.dfa
    this.reset()
  }

  reset() {
    this.state = START
  }

  checkAttributes() {
    // TODO: check attributes
  }

  consume(token) {
    this.state = this.dfa.consume(this.state, token)
    if (this.state === -1) {
      return `${token} is not valid in ${this.spec.name}`
    }
  }

  isFinished() {
    return this.dfa.isFinished(this.state)
  }
}

class ValidatingChildNodeIterator {

  constructor(it, validator) {
    this._it = it
    this._validator = validator
    this._states = []
  }

  hasNext() {
    return this._it.hasNext()
  }

  next() {
    let error
    let next = this._it.next()
    let oldState = this._validator.state
    if (next.isTextNode()) {
      error = this._validator.consume(TEXT)
    } else if (next.isElementNode()) {
      error = this._validator.consume(next.tagName)
    }
    if (error) {
      if (next.isTextNode()) {
        console.error(`TEXT is invalid within <${this._validator.spec.name}>. Skipping.`, next.textContent)
      } else if (next.isElementNode()) {
        console.error(`<${next.tagName}> is invalid within <${this._validator.spec.name}>. Skipping.`, next)
      }
      this._validator.state = oldState
      return next.createComment(next.outerHTML)
    } else {
      this._states.push(this._validator.state)
      return next
    }
  }

  back() {
    this._it.back()
    this._validator.state = this._states.pop()
    return this
  }

  peek() {
    return this._it.peek()
  }

}
