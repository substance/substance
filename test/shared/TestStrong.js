import { PropertyAnnotation } from 'substance'

export default class TestStrong extends PropertyAnnotation {
  define () {
    return {
      type: 'strong'
    }
  }

  static get autoExpandRight () { return true }
}
