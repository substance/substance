import TextBlock from '../../model/TextBlock'

class Heading extends TextBlock {}

Heading.schema = {
  type: "heading",
  level: { type: "number", default: 1 }
}

export default Heading
