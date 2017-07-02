import { last } from '../util'
import DFA from './DFA'

const TEXT = DFA.TEXT
const START = DFA.START

export default
class XMLValidator {

  constructor(xmlSchema) {
    this.schema = xmlSchema
    this.errors = []
  }

  getElementValidator(el) {
    const tagName = el.tagName
    let elementSchema = this.schema.getElementSchema(tagName)
    if (!elementSchema) throw new Error(`Unsupported element: ${tagName}`)
    return new ElementValidator(el, elementSchema)
  }

  validate(el) {
    this.errors = []

    let valid = true
    let q = [el]
    while(q.length>0) {
      let next = q.shift()
      const elValidator = this.getElementValidator(next)
      if (!elValidator.isValid()) {
        this.errors = this.errors.concat(elValidator.errors)
        valid = false
      }
      if (next.isElementNode()) {
        q = q.concat(next.getChildren())
      }
    }

    if (!valid) return this.errors.slice()
  }

  getValidatingChildNodeIterator(el) {
    return new ValidatingChildNodeIterator(el.getChildNodeIterator(), this.getElementValidator(el))
  }
}

class ElementValidator {

  constructor(el, elementSchema) {
    this.el = el
    this.elementSchema = elementSchema
    this.dfa = elementSchema.dfa

    this.state = START
    this.pos = 0
    this.errors = []

    this.reset()
  }

  reset() {
    this.state = START
    this.trace = []
    this.errors = []
  }

  /*
    Checks if the element is valid.

    Not recursively.
  */
  isValid() {
    this.reset()

    const el = this.el
    this.checkAttributes()

    // Don't validate external nodes
    // TODO: maybe we should do this too?
    if (this.elementSchema.type === 'external') {
      return true
    }

    const iterator = el.getChildNodeIterator()
    let valid = (this.errors.length === 0)
    while (valid && iterator.hasNext()) {
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
      if (!this.consume(token)) {
        valid = false
      }
    }
    if (valid && !this.isFinished()) {
      this.errors.push({
        msg: `<${el.tagName}> is incomplete.`,
        el
      })
      valid = false
    }
    return valid
  }

  checkAttributes() {
    // TODO: check attributes
  }

  consume(token) {
    let oldState = this.state
    let newState = this.dfa.consume(oldState, token)
    this.state = newState
    if (newState === -1) {
      this.errors.push({
        msg: this._describeError(token),
        el: this.el
      })
      return false
    } else {
      this.trace.push(token)
      return true
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
        msg.push(`<${token}> is not allowed at the current position in <${this.elementSchema.name}>.`)
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
    let next = this._it.next()
    let oldState = this._validator.state
    let ok
    if (next.isTextNode()) {
      ok = this._validator.consume(TEXT)
    } else if (next.isElementNode()) {
      ok = this._validator.consume(next.tagName)
    }
    if (!ok) {
      if (next.isTextNode()) {
        const text = next.textContent
        if (!/^\s*$/.exec(text)) {
          console.error(`TEXT is invalid within <${this._validator.elementSchema.name}>. Skipping.`, next.textContent)
        }
      } else if (next.isElementNode()) {
        let error = last(this._validator.errors)
        console.error(error.msg, error.el.getNativeElement())
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
