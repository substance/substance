import Marker from '../../model/Marker'

class SpellError extends Marker {
  invalidate() {
    this.remove()
  }
}

SpellError.define({
  type: 'spell-error',
  suggestions: { type: ['object'], default: [] }
})

SpellError.scope = 'document'

export default SpellError
