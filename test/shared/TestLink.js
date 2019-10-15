import { STRING, PropertyAnnotation } from 'substance'

export default class TestLink extends PropertyAnnotation {
  shouldNotSplit () { return true }

  define () {
    return {
      type: 'link',
      href: STRING
    }
  }
}
