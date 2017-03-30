import { TextBlock } from '../../model'

class Heading extends TextBlock {}

Heading.schema = {
  type: "heading",
  level: { type: "number", default: 1 }
}

export default Heading
