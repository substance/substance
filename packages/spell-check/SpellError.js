import { Marker } from '../../model'

class SpellError extends Marker {
  invalidate() {
    this.remove()
  }
}

SpellError.schema = {
  type: 'spell-error',
  suggestions: { type: ['object'], default: [] }
}

SpellError.scope = 'document'

export default SpellError
