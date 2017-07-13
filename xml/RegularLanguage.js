import { forEach } from '../util'
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

}

export function createExpression(name, root) {
  if (root instanceof Interleave) {
    return new InterleaveExpr(name, root)
  } else {
    return new DFAExpr(name, root)
  }
}

class DFAExpr extends Expression {

  _initialize() {
    super._initialize()

    this._computeAllowedChildren()
  }

  _compile() {
    super._compile()
    this.dfa = new DFA(this.root.dfa.transitions)
  }

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

  _describeError(state, token) {
    let msg = []
    if (token !== TEXT) {
      if (!this.isAllowed(token)) {
        msg.push(`<${token}> is not a valid in <${this.name}>`)
      } else {
        // otherwise just the position is wrong
        msg.push(`<${token}> is not allowed at the current position in <${this.name}>.`)
        // TODO: try to find a suitable alternative position
        // we need to refactor this, as here we do not have access to the actual element
        // so we can't tell, if there is a valid position
      }
    } else {
      msg.push(`TEXT is not allowed at the current position. ${state.trace.join(',')}`)
    }
    return msg.join('')
  }

  _computeAllowedChildren() {
    const dfa = this.dfa
    // Note: collecting all children
    const children = {}
    if (dfa.transitions) {
      forEach(dfa.transitions, (T) => {
        Object.keys(T).forEach((tagName) => {
          if (tagName === TEXT) {
            this._canContainText = true
            return
          }
          if (tagName === EPSILON) return
          children[tagName] = true
        })
      })
    }
    this._allowedChildren = children
  }

  isAllowed(tagName) {
    return Boolean(this._allowedChildren[tagName])
  }

}

class InterleaveExpr extends Expression {
}

export class Token {

  constructor(name) {
    this.name = name
  }

  toString() {
    return this.name
  }

  copy() {
    return new Token(this.name)
  }

  _normalize() {}

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

  _normalize() {
    // TODO
  }

}

/*
  ()?
*/
export class Optional {

  constructor(block) {
    this.block = block
  }

  copy() {
    return new Interleave(this.block.copy())
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

/*
  ()*
*/
export class Kleene {

  constructor(block) {
    this.block = block
  }

  copy() {
    return new Interleave(this.block.copy())
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

/*
  ()+
*/
export class Plus {

  constructor(block) {
    this.block = block
  }

  copy() {
    return new Interleave(this.block.copy())
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
