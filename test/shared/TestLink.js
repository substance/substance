import { STRING, PropertyAnnotation } from 'substance'

export default class TestLink extends PropertyAnnotation {
  shouldNotSplit () { return true }
}

TestLink.schema = {
  type: 'link',
  href: STRING
}
