import { forEach, isString } from '../util'
import DFABuilder from './DFABuilder'
import DFA from './DFA'

const { START, END, TEXT, EPSILON } = DFA

// retains the structured representation
// and compiles a DFA for efficient processing
export class Expression {

  constructor(name, root) {
    this.name = name
    this.root = root

    this._initialize()
  }

  _initialize() {
    this._compile()
  }

  toString() {
    return this.root.toString()
  }

  copy() {
    return this.root.copy()
  }

  toJSON() {
    return {
      name: this.name,
      content: this.root.toJSON()
    }
  }

  isAllowed(tagName) {
    return Boolean(this._allowedChildren[tagName])
  }

  /*
    Simplifies the whole expression eliminating unnecessary structure.
  */
  _normalize() {
    this.root._normalize()
  }

  /*
    Some structures get compiled into a DFA, for instance.
  */
  _compile() {
    // TODO: we need to
    this.root._compile()
  }

  _describeError(state, token) {
    let msg = []
    if (token !== TEXT) {
      if (!this.isAllowed(token)) {
        msg.push(`<${token}> is not valid in <${this.name}>\n${this.toString()}`)
      } else {
        // otherwise just the position is wrong
        msg.push(`<${token}> is not allowed at the current position in <${this.name}>.\n${this.toString()}`)
        // TODO: try to find a suitable alternative position
        // we need to refactor this, as here we do not have access to the actual element
        // so we can't tell, if there is a valid position
      }
    } else {
      msg.push(`TEXT is not allowed at the current position: ${state.trace.join(',')}\n${this.toString()}`)
    }
    return msg.join('')
  }

}

Expression.fromJSON = function(data) {
  const name = data.name
  const root = _fromJSON(data.content)
  return createExpression(name, root)
}

export function createExpression(name, root) {
  if (root instanceof Interleave) {
    return new InterleaveExpr(name, root)
  } else {
    return new DFAExpr(name, root)
  }
}

export class DFAExpr extends Expression {

  // validation API
  getInitialState() {
    return {
      dfaState: START,
      errors: [],
      trace: [],
    }
  }

  canConsume(state, token) {
    return this.dfa.canConsume(state.dfaState, token)
  }

  consume(state, token) {
    const dfa = this.dfa
    let oldState = state.dfaState
    let newState = dfa.consume(oldState, token)
    state.dfaState = newState
    if (newState === -1) {
      state.errors.push({
        msg: this._describeError(state, token),
        // HACK: we want to have the element with the errors
        // but actually, here we do not know about that context
        el: state.el
      })
      return false
    } else {
      state.trace.push(token)
      return true
    }
  }

  isFinished(state) {
    return this.dfa.isFinished(state.dfaState)
  }

  _initialize() {
    super._initialize()

    this._computeAllowedChildren()
  }

  _compile() {
    super._compile()
    this.dfa = new DFA(this.root.dfa.transitions)
  }


  _computeAllowedChildren() {
    this._allowedChildren = _collectAllTokensFromDFA(this.dfa)
  }

  _findInsertPos(el, newTag, mode) {
    const root = this.root
    if (root instanceof Sequence) {
      return this._findInsertPosInSequence(el, newTag, mode)
    } else if (root instanceof Plus || root instanceof Kleene) {
      if (mode === 'first') {
        return 0
      } else {
        return el.childNodes.length
      }
    }
  }

  _isValid(_tokens) {
    let state = this.getInitialState()
    for (let i = 0; i < _tokens.length; i++) {
      if (!this.consume(state, _tokens[i])) {
        return false
      }
    }
    return this.isFinished(state)
  }

  _findInsertPosInSequence(el, newTag, mode) {
    const childNodes = el.getChildNodes()
    // Note: we try out all combinations, starting either at the end
    // or at the beginning, and return the first valid combination
    // Probably this could be improved, this is a start, though
    const tokens = childNodes.map((child)=>{
      // ATTENTION: here we have get XMLDocumentNodes
      // i.e. TextNodes are something totally different
      const tagName = child.tagName
      if (!tagName) {
        throw new Error('FIXME: Internal error.')
      }
      return tagName
    })
    const L = tokens.length
    const self = this
    function _isValid(pos) {
      let _tokens = tokens.slice(0)
      _tokens.splice(pos, 0, newTag)
      return self._isValid(_tokens)
    }
    if (mode === 'first') {
      for (let pos = 0; pos <= L; pos++) {
        if (_isValid(pos)) {
          return pos
        }
      }
    } else {
      for (let pos = L; pos >= 0; pos--) {
        if (_isValid(pos)) {
          return pos
        }
      }
    }
    return -1
  }

}

function _collectAllTokensFromDFA(dfa) {
  // Note: collecting all children
  const children = {}
  if (dfa.transitions) {
    forEach(dfa.transitions, (T) => {
      Object.keys(T).forEach((tagName) => {
        if (tagName === EPSILON) return
        children[tagName] = true
      })
    })
  }
  return children
}

export class InterleaveExpr extends Expression {

  constructor(name, root) {
    super(name, root)
  }

  getInitialState() {
    const dfas = this.dfas
    const dfaStates = new Array(dfas.length)
    dfaStates.fill(START)
    return {
      dfaStates,
      errors: [],
      trace: [],
      // maintain the index of the dfa which has been consumed the last token
      lastDFA: 0,
    }
  }

  canConsume(state, token) {
    return (this._findNextDFA(state, token) >= 0)
  }

  consume(state, token) {
    const idx = this._findNextDFA(state, token)
    if (idx < 0) {
      state.errors.push({
        msg: this._describeError(state, token),
      })
      return false
    } else {
      const dfa = this.dfas[idx]
      const oldState = state.dfaStates[idx]
      const newState = dfa.consume(oldState, token)
      state.dfaStates[idx] = newState
      state.trace.push(token)
      return true
    }
  }

  isFinished(state) {
    const dfas = this.dfas
    for (let i = 0; i < dfas.length; i++) {
      const dfa = dfas[i]
      const dfaState = state.dfaStates[i]
      if (!dfa.isFinished(dfaState)) {
        return false
      }
    }
    return true
  }


  _initialize() {
    super._initialize()

    this._computeAllowedChildren()
  }

  _compile() {
    super._compile()

    this.blocks = this.root.blocks
    this.dfas = this.blocks.map(b=>new DFA(b.dfa.transitions))
  }

  _computeAllowedChildren() {
    this._allowedChildren = Object.assign(...this.blocks.map((block) => {
      return _collectAllTokensFromDFA(block.dfa)
    }))
  }

  _findNextDFA(state, token) {
    console.assert(state.dfaStates.length === this.dfas.length)
    const dfas = this.dfas
    for (let i = 0; i < state.dfaStates.length; i++) {
      const dfa = dfas[i]
      const dfaState = state.dfaStates[i]
      if (dfa.canConsume(dfaState, token)) {
        return i
      }
    }
    return -1
  }

  _findInsertPos(el, newTag, mode) { // eslint-disable-line
    // TODO: we need to find out a correct way to do this
    return el.childNodes.length
  }

}

export class Token {

  constructor(name) {
    this.name = name
  }

  toString() {
    return this.name
  }

  toJSON() {
    return this.name
  }

  copy() {
    return new Token(this.name)
  }

  _normalize() {}

  _compile() {
    this.dfa = DFABuilder.singleToken(this.name)
  }

}

Token.fromJSON = function (data) {
  return new Token(data)
}

/*
  (a|b|c)
*/
export class Choice {

  constructor(blocks) {
    this.blocks = blocks
  }

  copy() {
    return new Choice(this.blocks.map(b=>b.copy()))
  }

  toJSON() {
    return {
      type: '|',
      blocks: this.blocks.map(b=>b.toJSON())
    }
  }

  _normalize() {
    const blocks = this.blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      let block = blocks[i]
      block._normalize()
      // unwrap doubled Choices
      if (block instanceof Choice) {
        blocks.splice(i,1,...(block.blocks))
      }
    }
  }


  _compile() {
    let dfa = new DFABuilder()
    this.blocks.forEach((block) => {
      if (block instanceof Token) {
        dfa.addTransition(START, END, block.name)
      } else if (block instanceof Interleave) {
        throw new Error('Nested interleave blocks are not supported.')
      } else {
        if (!block.dfa) {
          block._compile()
        }
        dfa.merge(block.dfa)
      }
    })
    this.dfa = dfa
    return dfa
  }

  toString() {
    return '('+ this.blocks.map(b=>b.toString()).join('|') + ')'
  }

}

Choice.fromJSON = function(data) {
  return new Choice(data.blocks.map((block) => {
    return _fromJSON(block)
  }))
}

/*
  (a,b,c) (= ordered)
*/
export class Sequence {

  constructor(blocks) {
    this.blocks = blocks
  }

  copy() {
    return new Sequence(this.blocks.map(b=>b.copy()))
  }

  toJSON() {
    return {
      type: ',',
      blocks: this.blocks.map(b=>b.toJSON())
    }
  }

  _compile() {
    let dfa = new DFABuilder()
    this.blocks.forEach((block) => {
      if (block instanceof Token) {
        dfa.append(DFABuilder.singleToken(block.name))
      } else if (block instanceof Interleave) {
        throw new Error('Nested interleave blocks are not supported.')
      } else {
        if (!block.dfa) {
          block._compile()
        }
        dfa.append(block.dfa)
      }
    })
    this.dfa = dfa
    return dfa
  }

  _normalize() {
    const blocks = this.blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      let block = blocks[i]
      block._normalize()
      // unwrap doubled Choices
      if (block instanceof Sequence) {
        blocks.splice(i, 1,...(block.blocks))
      }
    }
  }

  toString() {
    return '('+ this.blocks.map(b=>b.toString()).join(',') + ')'
  }

}

Sequence.fromJSON = function(data) {
  return new Sequence(data.blocks.map((block) => {
    return _fromJSON(block)
  }))
}

/*
  ~(a,b,c) (= unordered)
*/
export class Interleave {

  constructor(blocks) {
    this.blocks = blocks
  }

  copy() {
    return new Interleave(this.blocks.map(b=>b.copy()))
  }

  toString() {
    return '('+ this.blocks.map(b=>b.toString()).join('~') + ')'
  }

  toJSON() {
    return {
      type: '~',
      blocks: this.blocks.map(b=>b.toJSON())
    }
  }

  _normalize() {
    // TODO
  }

  _compile() {
    this.blocks.forEach(block => block._compile())
  }

}

Interleave.fromJSON = function(data) {
  return new Interleave(data.blocks.map((block) => {
    return _fromJSON(block)
  }))
}


/*
  ()?
*/
export class Optional {

  constructor(block) {
    this.block = block
  }

  copy() {
    return new Optional(this.block.copy())
  }

  toJSON() {
    return {
      type: '?',
      block: this.block.toJSON()
    }
  }

  _compile() {
    const block = this.block
    if (block instanceof Interleave) {
      throw new Error('Nested interleave blocks are not supported.')
    }
    if (!block.dfa) {
      block._compile()
    }
    this.dfa = block.dfa.optional()
    return this.dfa
  }

  _normalize() {
    const block = this.block
    block._normalize()
    if (block instanceof Optional) {
      this.block = block.block
    } else if (block instanceof Kleene) {
      console.error('FIXME -  <optional> is useless here', this.toString())
    }
  }

  toString() {
    return this.block.toString() + '?'
  }

}

Optional.fromJSON = function(data) {
  return new Optional(_fromJSON(data.block))
}


/*
  ()*
*/
export class Kleene {

  constructor(block) {
    this.block = block
  }

  copy() {
    return new Kleene(this.block.copy())
  }

  toJSON() {
    return {
      type: '*',
      block: this.block.toJSON()
    }
  }

  _compile() {
    const block = this.block
    if (block instanceof Interleave) {
      throw new Error('Nested interleave blocks are not supported.')
    }
    if (!block.dfa) {
      block._compile()
    }
    this.dfa = block.dfa.kleene()
    return this.dfa
  }

  _normalize() {
    const block = this.block
    block._normalize()
    if (block instanceof Optional || block instanceof Kleene) {
      this.block = block.block
    } else if (block instanceof Plus) {
      throw new Error('This does not make sense:' + this.toString())
    }
  }

  toString() {
    return this.block.toString() + '*'
  }

}

Kleene.fromJSON = function(data) {
  return new Kleene(_fromJSON(data.block))
}

/*
  ()+
*/
export class Plus {

  constructor(block) {
    this.block = block
  }

  copy() {
    return new Plus(this.block.copy())
  }

  toJSON() {
    return {
      type: '+',
      block: this.block.toJSON()
    }
  }

  _compile() {
    const block = this.block
    if (block instanceof Interleave) {
      throw new Error('Nested interleave blocks are not supported.')
    }
    if (!block.dfa) {
      block._compile()
    }
    this.dfa = block.dfa.plus()
    return this.dfa
  }

  _normalize() {
    const block = this.block
    block._normalize()
    if (block instanceof Optional || block instanceof Kleene) {
      throw new Error('This does not make sense:' + this.toString())
    } else if (block instanceof Plus) {
      this.block = block.block
    }
  }

  toString() {
    return this.block.toString() + '+'
  }
}

Plus.fromJSON = function(data) {
  return new Plus(_fromJSON(data.block))
}

function _fromJSON(data) {
  switch(data.type) {
    case ',':
      return Sequence.fromJSON(data)
    case '~':
      return Interleave.fromJSON(data)
    case '|':
      return Choice.fromJSON(data)
    case '?':
      return Optional.fromJSON(data)
    case '+':
      return Plus.fromJSON(data)
    case '*':
      return Kleene.fromJSON(data)
    default:
      if (isString(data)) {
        return new Token(data)
      }
      throw new Error('Unsupported data.')
  }
}