import { last } from '../util'
import DFA from './DFA'

const { TEXT } = DFA

export default class ValidatingChildNodeIterator {

  constructor(el, it, expr) {
    this.el = el
    this.it = it
    this.expr = expr
    this.state = expr.getInitialState()
    this._oldStates = []
  }

  hasNext() {
    return this.it.hasNext()
  }

  next() {
    const state = this.state
    const expr = this.expr
    let next = this.it.next()
    let oldState = cloneDeep(this.state)
    let ok
    if (next.isTextNode()) {
      ok = expr.consume(state, TEXT)
    } else if (next.isElementNode()) {
      ok = expr.consume(state, next.tagName)
    }
    if (!ok) {
      if (next.isTextNode()) {
        const text = next.textContent
        if (!/^\s*$/.exec(text)) {
          console.error(`TEXT is invalid within <${expr.name}>. Skipping.`, next.textContent)
        }
      } else if (next.isElementNode()) {
        let error = last(state.errors)
        console.error(error.msg, this.el.getNativeElement())
      }
      // recover the old state
      this.state = oldState
      return next.createComment(next.outerHTML)
    } else {
      this._oldStates.push(oldState)
      return next
    }
  }

  back() {
    this.it.back()
    this.state = this._oldStates.pop()
    return this
  }

  peek() {
    return this.it.peek()
  }

}
