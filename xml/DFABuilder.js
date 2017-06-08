import { forEach, isArray, cloneDeep, uuid } from '../util'
import DFA from './DFA'

const START = DFA.START
const END = DFA.END
const EPSILON = DFA.EPSILON

/*
  DFABuilder is essentially a graph implementation
  helping to build DFAs incrementally, by composing smaller
  sub-DFAs.
*/
export default class DFABuilder {

  constructor(transitions) {
    this.transitions = transitions
  }

  addTransition(from, to, tokens) {
    if (!this.transitions) this.transitions = {}
    if (!isArray(tokens)) tokens = [tokens]
    tokens.forEach(token => _addTransition(this.transitions, from, to, token))
    return this
  }

  /*
    Creates a new DFA with all state values shifted by a given offset.
    Used when appending this DFA to another one (-> sequence)

    ```
    Expression: A,B

    Graph:  S - [A] -> E
            S - [B] -> E
            =
            S - [A] -> N - [B] -> E
    ```
  */
  append(other) {
    if (this.transitions && other.transitions) {
      let t1 = cloneDeep(this.transitions)
      let t2 = cloneDeep(other.transitions)
      // we need to be careful with EPSILON transitions
      // so that don't end up having a NDFA.
      let firstIsOptional = Boolean(t1[START][EPSILON])
      let secondIsOptional = Boolean(t2[START][EPSILON])

      if (firstIsOptional) {
        // we remove the epsilon transition from the first
        // as it would be in the way for the transformations done below
        delete t1[START][EPSILON]
      }
      // for the concatenation we insert a new state and adapt
      // the transitions of the first and second DFA to use the new state
      let newState = uuid()
      // let transitions of the first going to END
      // now point to the new state
      forEach(t1, (T) => {
        forEach(T, (to, token) => {
          if (to === END) {
            T[token] = newState
          }
        })
      })
      // If the first is optional we add transitions from
      // START to the new state
      if (firstIsOptional) {
        forEach(t2[START], (to, token) => {
          _addTransition(t1, START, to, token)
        })
      }
      // for concatenation we let transitions of the second DFA
      // going from and to START now go from and to the new state
      t2[newState] = t2[START]
      forEach(t2, (T) => {
        forEach(T, (to, token) => {
          if (to === START) {
            T[token] = newState
          }
        })
      })
      delete t2[START]
      // and now we can merge in the transitions
      forEach(t2, (T, from) => {
        forEach(T, (to, token) => {
          _addTransition(t1, from, to, token)
        })
      })
      // finally we add back an EPSILON transition
      // if both DFAs were optional
      if (firstIsOptional && secondIsOptional) {
        _addTransition(t1, START, END, EPSILON)
      }
      this.transitions = t1
    } else if (other.transitions) {
      this.transitions = cloneDeep(other.transitions)
    }
    return this
  }

  /*
    Merges to DFAs.

    Used to implement choices.

    ```
    Expression: A | B

    Graph:     - [A] -
              /       \
            S          > E
              \       /
               - [B] -

    ```
  */
  merge(other) {
    if (this.transitions && other.transitions) {
      let t1 = this.transitions
      let t2 = other.transitions
      forEach(t2, (T, from) => {
        forEach(T, (to, token) => {
          _addTransition(t1, from, to, token)
        })
      })
    } else if (other.transitions) {
      this.transitions = cloneDeep(other.transitions)
    }
    return this
  }

  /*
    Creates a new DFA with same transitions
    plus an EPSILON transition from start to END

    ```
    Expression: A?

    Graph:     - [A] -
              /       \
            S          > E
              \       /
               -  ε  -
    ```
  */
  optional() {
    let dfa = new DFABuilder(cloneDeep(this.transitions))
    if (this.transitions) {
      dfa.addTransition(START, END, EPSILON)
    }
    return dfa
  }

  /*
    Creates a new DFA representing (A)*

    ```
    Expression: A* = (A+)?

                       /-[A]-\
                       |     |
                        \   /
                         v /
    Graph:   S -- [A] --> 1  -- ε -->  E
              \                    /
               \   --    ε   --   /

    ```
  */
  kleene() {
    let dfa = this.plus()
    return dfa.optional()
  }

  /*
    Creates a new DFA representing (...)+ by concatenating this
    with a kleene version: A+ = A A*

    ```
    Expression: (A)+ (sequence and reflexive edge)

                       /-[A]-\
                       |     |
                        \   /
                         v /
    Graph:  S -- [A] -->  N  -- ε -> E

    ```
  */
  plus() {
    let dfa
    if (this.transitions) {
      let t1 = cloneDeep(this.transitions)
      // there might exist an EPSILON transition already
      // which we must remove to fulfill our internal
      // assumption that there is only one EPSILON transition from
      // START going to END
      const isOptional = Boolean(t1[START][EPSILON])
      delete t1[START][EPSILON]
      // introduce a new state
      // and let all 'ending' edges point to new state
      let newState = uuid()
      forEach(t1, (T) => {
        forEach(T, (to, token) => {
          if (to === END) {
            T[token] = newState
          }
        })
      })
      // add 'ending' EPSILON transition
      _addTransition(t1, newState, END, EPSILON)
      // copy all starting edges
      forEach(t1[START], (to, token) => {
        _addTransition(t1, newState, to, token)
      })
      // recover 'optional'
      if (isOptional) {
        _addTransition(t1, START, END, EPSILON)
      }
      dfa = new DFABuilder(t1)
    } else {
      dfa = new DFABuilder(cloneDeep(this.transitions))
    }
    return dfa
  }

  toJSON() {
    return cloneDeep(this.transitions)
  }

  // creates a copy of this DFA, with new state IDS
  copy() {
    let t = cloneDeep(this.transitions)
    if (this.transitions) {
      let states = Object.keys(t)
      let map = { START: START, END: END }
      states.forEach((id) => {
        if (id === START || id === END) return
        map[id] = uuid()
      })
      forEach(t, (T, from) => {
        if (from !== START && from !== END) {
          t[map[from]] = T
          delete t[from]
        }
        forEach(T, (to, token) => {
          if (to !== START && to !== END) {
            T[token] = map[to]
          }
        })
      })
    }
    return new DFABuilder(t)
  }

}

DFABuilder.singleToken = function(token) {
  let dfa = new DFABuilder()
  dfa.addTransition(START, END, token)
  return dfa
}

function _addTransition(transitions, from, to, token) {
  let T = transitions[from]
  if (!T) {
    transitions[from] = T = {}
  }
  if (token === EPSILON && from === START && to !== END) {
    throw new Error('The only EPSILON transition from START must be START->END')
  }
  if (T[token] && T[token] !== to) {
    console.error('Token %s already used. Ignoring this transition.', token)
    return
    // throw new Error('Token already used in this state')
  }
  T[token] = to
}
