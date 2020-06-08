import { PropertyAnnotation } from 'substance'

export default class TestSubscript extends PropertyAnnotation {
  define () {
    return {
      type: 'subscript'
    }
  }

  static get autoExpandRight () { return true }
}
