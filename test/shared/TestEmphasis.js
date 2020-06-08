import { PropertyAnnotation } from 'substance'

export default class TestEmphasis extends PropertyAnnotation {
  define () {
    return {
      type: 'emphasis'
    }
  }

  static get autoExpandRight () { return true }
}
