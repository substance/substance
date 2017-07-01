import DFA from './DFA'

const TEXT = DFA.TEXT
const START = DFA.START

export default
class XMLValidator {

  constructor(xmlSchema) {
    this.schema = xmlSchema
    this.errors = []
  }

  getElementValidator(tagName) {
    let elementSchema = this.schema.getElementSchema(tagName)
    if (!elementSchema) throw new Error(`Unsupported element: ${tagName}`)
    return new ElementValidator(elementSchema)
  }

  isValid(el) {
    const name = el.tagName
    const elValidator = this.getElementValidator(name)
    const errors = elValidator.checkAttributes(el)
    if (errors) {
      this.errors = this.errors.concat(errors)
    }
    if (elValidator.elementSchema.type === 'external') {
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
        this.errors.push({
          msg: error,
          el
        })
        valid = false
      }
    }
    if (valid && !elValidator.isFinished()) {
      this.errors.push({
        msg: `<${el.tagName}> is incomplete`,
        el
      })
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

  constructor(elementSchema) {
    this.elementSchema = elementSchema
    this.dfa = elementSchema.dfa
    this.state = START
    this.trace = []
    this.reset()
  }

  reset() {
    this.state = START
    this.trace = []
  }

  checkAttributes() {
    // TODO: check attributes
  }

  consume(token) {
    let oldState = this.state
    let newState = this.dfa.consume(oldState, token)
    this.state = newState
    if (newState === -1) {
      return this._describeError(token)
    } else {
      this.trace.push(token)
    }
  }

  isFinished() {
    return this.dfa.isFinished(this.state)
  }

  _describeError(token) {
    let msg = []
    if (token !== TEXT) {
      if (!this.elementSchema.isAllowed(token)) {
        msg.push(`<${token}> is not a valid child element of <${this.elementSchema.name}>`)
      } else {
        // otherwise just the position is wrong
        msg.push(`<${token}> is not allowed at the current position.`)
        // TODO: try to find a suitable alternative position
        // we need to refactor this, as here we do not have access to the actual element
        // so we can't tell, if there is a valid position
      }
    } else {
      msg.push(`TEXT is not allowed at the current position. ${this.trace.join(',')}`)
    }
    return msg.join('')
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
        const text = next.textContent
        if (!/^\s*$/.exec(text)) {
          console.error(`TEXT is invalid within <${this._validator.elementSchema.name}>. Skipping.`, next.textContent)
        }
      } else if (next.isElementNode()) {
        console.error(`<${next.tagName}> is invalid within <${this._validator.elementSchema.name}>. Skipping.`, next)
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
