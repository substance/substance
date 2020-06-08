import { PropertyAnnotation } from 'substance'

export default class TestSuperscript extends PropertyAnnotation {
  define () {
    return {
      type: 'superscript'
    }
  }

  static get autoExpandRight () { return true }
}
