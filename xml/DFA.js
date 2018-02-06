import forEach from '../util/forEach'

const START = 'START'
const END = 'END'
const EPSILON = 'EPSILON'
const TEXT = 'TEXT'

export default
class DFA {

  constructor(transitions) {
    if (!transitions || Object.keys(transitions).length === 0) {
      transitions = { START: { EPSILON: END } }
    }
    this.transitions = transitions
  }

  consume(state, id) {
    const T = this.transitions
    // e.g. this happens, if the state is already END
    // and more tokens are coming
    if (!T[state]) return -1
    let nextState = T[state][id]
    if (nextState !== undefined) {
      return nextState
    }
    while(T[state][EPSILON] !== undefined) {
      state = T[state][EPSILON]
      if (state === END) {
        return -1
      }
      nextState = T[state][id]
      if (nextState !== undefined) {
        return nextState
      }
    }
    return -1
  }

  canConsume(state, id) {
    let nextState = this.consume(state, id)
    return (nextState !== -1)
  }

  isFinished(state) {
    const T = this.transitions
    if (state === 'END') return true
    // if the state is invalid
    if (!T[state]) return false
    while(T[state][EPSILON] !== undefined) {
      state = T[state][EPSILON]
      if (state === 'END') return true
    }
    return false
  }

  // Helpers to analyze

  // generates all sets of tokens, reached on all different paths
  _tokensByPath() {
    const result = []
    const transitions = this.transitions
    if (!transitions) return []

    // group start edges by follow state
    let first = {}
    forEach(transitions[START], (to, token) => {
      if (!first[to]) first[to] = []
      first[to].push(token)
    })

    let visited = {START: true, END: true}
    forEach(first, (tokens, state) => {
      // walk all states that can be reached on this path
      // and collect all tokens
      // we consider them as potential siblings, as they
      // can co-occur at the same level
      let _siblings = {}
      tokens.forEach((t) => {
        if (t !== EPSILON) {
          _siblings[t] = true
        }
      })
      let stack = [state]
      while(stack.length > 0) {
        let from = stack.pop()
        if (state === END) continue
        visited[from] = true
        let T = transitions[from]
        if (!T) throw new Error(`Internal Error: no transition from state ${from}`)
        let tokens = Object.keys(T)
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i]
          const to = T[token]
          if (!visited[to]) stack.push(to)
          if (token !== EPSILON) {
            _siblings[token] = true
          }
        }
      }
      let _siblingTokens = Object.keys(_siblings)
      if (_siblingTokens.length > 0) {
        result.push(_siblingTokens)
      }
    })
    return result
  }

}

DFA.START = START
DFA.END = END
DFA.EPSILON = EPSILON
DFA.TEXT = TEXT
